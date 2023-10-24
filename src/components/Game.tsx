import { For, Show, type JSXElement } from "solid-js";
import { TransitionGroup } from "solid-transition-group";
import { createGame } from "../game";

export default function Game(): JSXElement {
  const { field, hasWon, reset, score, highscore } = createGame();

  return (
    <div>
      <div class="text-center mb-5">
        <div class="text-lg font-medium text-blue-500 dark:text-blue-500">Score: {score()}</div>
        <div class="text-lg font-medium text-fuchsia-700 dark:text-fuchsia-500">
          Highscore: {highscore()}
        </div>
      </div>
      <div class="flex justify-center mb-5">
        <button
          class="bg-blue-500 dark:bg-blue-300 text-white dark:text-black px-3 py-2 rounded"
          onClick={reset}
        >
          Reset
        </button>
      </div>
      <div class="select-none grid grid-cols-4 gap-2 bg-blue-100 dark:bg-blue-950 rounded-lg p-3 max-w-sm mx-auto">
        <TransitionGroup name="group-item">
          <For each={field()} fallback={<div>fallback</div>}>
            {(item) => (
              <div
                classList={{
                  "bg-blue-200 dark:bg-blue-900": item.value === 0,
                  "bg-indigo-300 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-400":
                    item.value === 2,
                  "bg-indigo-400 dark:bg-indigo-700 text-indigo-900 dark:text-indigo-300":
                    item.value === 4,
                  "bg-violet-300 dark:bg-violet-800 text-violet-800 dark:text-violet-400":
                    item.value === 8,
                  "bg-violet-400 dark:bg-violet-700 text-violet-900 dark:text-violet-300":
                    item.value === 16,
                  "bg-purple-300 dark:bg-purple-800 text-purple-800 dark:text-violet-400":
                    item.value === 32,
                  "bg-purple-400 dark:bg-purple-700 text-purple-900 dark:text-violet-300":
                    item.value === 64,
                  "bg-fuchsia-300 dark:bg-fuchsia-800 text-fuchsia-800 dark:text-fuchsia-400":
                    item.value === 128,
                  "bg-fuchsia-400 dark:bg-fuchsia-700 text-fuchsia-900 dark:text-fuchsia-400":
                    item.value === 256,
                  "bg-pink-300 dark:bg-pink-800 text-pink-800 dark:text-pink-400":
                    item.value === 512,
                  "bg-pink-400 dark:bg-pink-700 text-pink-900 dark:text-pink-300":
                    item.value === 1_024,
                  "bg-red-500 dark:bg-red-600 text-red-900 dark:text-red-100": item.value === 2_048,
                }}
                class="group-item rounded text-2xl font-bold flex justify-center items-center w-full aspect-ratio-square"
              >
                <Show when={item.value > 0}>
                  <span>{item.value}</span>
                </Show>
              </div>
            )}
          </For>
        </TransitionGroup>
      </div>
      <Show when={hasWon()}>
        <div class="text-xl text-fuchsia-700 dark:text-fuchsia-500 font-semibold text-center mt-5">
          You have won!!!
        </div>
      </Show>
    </div>
  );
}
