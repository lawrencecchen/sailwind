import "solid-js";

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      clickOutside?: () => false;
      drag: {
        onDrag?: (
          e: MouseEvent,
          initialEvent: MouseEvent,
          immutableContainer: any
        ) => any;
        onDragStart?: () => void;
        onDragEnd?: () => void;
        cursorStyle?: string;
      };
    }
  }
}
