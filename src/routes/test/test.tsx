import { createSignal, Show } from "solid-js";
import { Transition } from "solid-transition-group";

const TestRoute = () => {
  const [show, setShow] = createSignal(true);
  return (
    <div class="p-10">
      <button onClick={() => setShow(!show())}>ayo</button>
      <Transition
        exitClass="opacity-100"
        exitToClass="opacity-0"
        exitActiveClass="duration-200 transition"
      >
        {/* {show() && <div class="">hi</div>} */}
        <Show when={show()}>
          <div>hi</div>
        </Show>
      </Transition>

      {/* <div class="text-8xl fw100 animate-bounce-alt animate-count-infinite animate-1s">
        unocss
      </div> */}
    </div>
  );
};
export default TestRoute;
