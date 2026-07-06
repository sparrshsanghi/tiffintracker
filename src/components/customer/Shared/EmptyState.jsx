export function EmptyState({ icon: Icon, title, body, className, iconClassName, titleClassName, bodyClassName, children }) {
  return (
    <div className={className}>
      <div className={iconClassName}>
        <Icon size={26} />
      </div>
      <p className={titleClassName}>{title}</p>
      <p className={bodyClassName}>{body}</p>
      {children}
    </div>
  );
}
