export function fireThemeTransition(event: React.MouseEvent<HTMLButtonElement>, toggle: () => void) {
  const x = event.clientX;
  const y = event.clientY;

  // Fallback for browsers that don't support View Transitions
  // @ts-ignore
  if (!document.startViewTransition) {
    toggle();
    return;
  }

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const isDark = document.documentElement.classList.contains('dark');

  // @ts-ignore
  const transition = document.startViewTransition(() => {
    toggle();
  });

  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ];

    document.documentElement.animate(
      {
        clipPath: isDark ? [...clipPath].reverse() : clipPath,
      },
      {
        duration: 500,
        easing: 'ease-in-out',
        pseudoElement: isDark ? '::view-transition-old(root)' : '::view-transition-new(root)',
      }
    );
  });
}
