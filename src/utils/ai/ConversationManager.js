import { addMessageToHistory } from "./ConversationState";
import { detectLocalIntent } from "./IntentRouter";
import { resolveEntities } from "./EntityResolver";
import { getNextStep } from "./TaskPlanner";
import { generateSummaryPrompt, buildDraftObject } from "./ConfirmationGenerator";

export async function processMessage(userInput, state, context, extractMaaAiIntent) {
  let updatedState = { ...state };
  updatedState = addMessageToHistory(updatedState, "user", userInput);

  const lowerInput = userInput.trim().toLowerCase();

  // If waiting for confirmation and user says yes/no
  if (updatedState.activeTask && updatedState.pendingConfirmation) {
    if (/\b(yes|yeah|yep|sure|ok|confirm|agree|send|do it|submit|correct|ha|haan|theek)\b/.test(lowerInput)) {
      updatedState.pendingConfirmation = false;
      const finalReply = "Done! I've sent this request to your manager for approval. You will receive a notification once approved.";
      return {
        reply: finalReply,
        state: {
          ...updatedState,
          activeTask: null,
          entities: {},
          pendingConfirmation: false,
          extractedDraft: null,
          history: [...updatedState.history, { role: "assistant", text: finalReply, time: Date.now() }],
        },
        submitDraft: updatedState.extractedDraft,
        clearDraft: true,
      };
    } else if (/\b(no|cancel|stop|dont|change|incorrect|wrong|abort|exit|na|nahi)\b/.test(lowerInput)) {
      const cancelReply = "Understood. I've cancelled the request. Let me know if you need help with anything else!";
      return {
        reply: cancelReply,
        state: {
          ...updatedState,
          activeTask: null,
          entities: {},
          pendingConfirmation: false,
          extractedDraft: null,
          history: [...updatedState.history, { role: "assistant", text: cancelReply, time: Date.now() }],
        },
        clearDraft: true,
      };
    }
  }

  // Determine/Route task if none is active
  let task = updatedState.activeTask;
  if (!task) {
    task = detectLocalIntent(userInput);
    
    if (!task) {
      try {
        const res = await extractMaaAiIntent(userInput);
        if (res && res.supported && res.extraction && res.extraction.intent !== "unsupported") {
          task = res.extraction.intent;
          updatedState.entities = { ...res.extraction };
        }
      } catch (e) {
        console.error("Initial classification failed", e);
      }
    }

    if (task) {
      updatedState.activeTask = task;
    }
  }

  // Handle enquiries that don't need manager approval (Informational answers)
  if (task === "payment_enquiry") {
    const rate = context.rate || 0;
    const paid = context.paid || 0;
    const payStatus = context.payStatus || "unpaid";
    const curMonLabel = context.curMonLabel || "this month";

    const reply = `Your payment status for **${curMonLabel}** is **${payStatus.toUpperCase()}**.
• **Monthly Rate**: ₹${rate}
• **Total Paid**: ₹${paid}
• **Pending Balance**: ₹${Math.max(0, rate - paid)}

Let me know if you need to pause your plan or update your preferences!`;

    updatedState.activeTask = null;
    updatedState.entities = {};
    return {
      reply,
      state: addMessageToHistory(updatedState, "assistant", reply),
    };
  }

  if (task === "subscription_enquiry") {
    const customer = context.customer || {};
    const plan = customer.plan || "daily";
    const food = customer.food || "Standard meal";
    const rate = customer.rate || 0;

    const reply = `Here are your subscription plan details:
• **Plan Type**: ${plan.charAt(0).toUpperCase() + plan.slice(1)} Tiffin
• **Preference**: ${food}
• **Rate**: ₹${rate}/month
• **Delivery Status**: ${customer.paused ? "⏸️ Paused" : "▶️ Active"}

Let me know if you would like me to pause, resume, or update anything!`;

    updatedState.activeTask = null;
    updatedState.entities = {};
    return {
      reply,
      state: addMessageToHistory(updatedState, "assistant", reply),
    };
  }

  // If still no task detected, conversational fallback
  if (!task) {
    const reply = `I can help you with:
• **Pausing / Resuming** meals (e.g., "Pause from tomorrow", "Vacation next week")
• **Updating preference** (e.g., "Extra chapati", "Less spicy", "No sweet")
• **Delivery updates** (e.g., "Change address")
• **Enquiries** (e.g., "Check my balance", "My plan details")
• **Leaving feedback** (e.g., "Rate yesterday's food 5 stars")

What would you like me to do?`;

    return {
      reply,
      state: addMessageToHistory(updatedState, "assistant", reply),
    };
  }

  // Resolve entities for the active task
  updatedState.entities = await resolveEntities(task, updatedState.entities, userInput, extractMaaAiIntent);

  // Formulate next step
  const nextStep = getNextStep(task, updatedState.entities);
  if (!nextStep.complete) {
    return {
      reply: nextStep.prompt,
      state: addMessageToHistory(updatedState, "assistant", nextStep.prompt),
    };
  }

  // If complete, generate confirmation prompt and draft object
  const summaryPrompt = generateSummaryPrompt(task, updatedState.entities);
  const draft = buildDraftObject(task, updatedState.entities);

  updatedState.pendingConfirmation = true;
  updatedState.extractedDraft = draft;

  return {
    reply: summaryPrompt,
    state: addMessageToHistory(updatedState, "assistant", summaryPrompt),
    draft,
  };
}
export { getInitialState } from "./ConversationState";
