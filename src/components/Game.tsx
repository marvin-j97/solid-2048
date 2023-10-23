import { createSignal, For, Show, type JSXElement, onMount, onCleanup } from "solid-js";
import { TransitionGroup } from "solid-transition-group";

type Tile = {
  value: number;
}

function spawnRandomTile(arr: number[], count = 1): number[] {
  const copy = [...arr];

  let created = 0;

  while (created < count) {
    if (copy.every(x => x > 0)) {
      return copy;
    }

    const idx = Math.floor(Math.random() * copy.length);
    if (copy[idx]! > 0) {
      continue;
    }

    copy[idx] = Math.random() > 0.5 ? 2 : 4;
    created++;
  }

  return copy;
}

function createInitialField(): number[] {
  const field = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  return spawnRandomTile(field, 2);
}

type MatrixRow<T> = [T, T, T, T];
type Matrix<T> = [MatrixRow<T>, MatrixRow<T>, MatrixRow<T>, MatrixRow<T>];

function buildMatrix<T>(arr: T[]): Matrix<T> {
  return [
    [arr[0]!, arr[1]!, arr[2]!, arr[3]!],
    [arr[4]!, arr[5]!, arr[6]!, arr[7]!],
    [arr[8]!, arr[9]!, arr[10]!, arr[11]!],
    [arr[12]!, arr[13]!, arr[14]!, arr[15]!],
  ]
}

function matrixToField<T>(matrix: Matrix<T>): T[] {
  return matrix.flat();
}

function shallowCopyMatrix<T>(matrix: Matrix<T>): Matrix<T> {
  const copiedMatrix = matrix.map((row) => [...row]);
  return copiedMatrix as Matrix<T>;
}

function rotateMatrixClockwise(matrix: Matrix<number>): Matrix<number> {
  const copy = shallowCopyMatrix(matrix);

  matrix.forEach((row, i) => {
    row.forEach((value, j) => {
      copy[j]![4 - 1 - i] = value;
    });
  });

  return copy as Matrix<number>;
}

function rotateMatrixCounterClockwise(matrix: Matrix<number>): Matrix<number> {
  const copy = shallowCopyMatrix(matrix);

  matrix.forEach((row, i) => {
    row.forEach((value, j) => {
      copy[4 - 1 - j]![i] = value;
    });
  });


  return copy as Matrix<number>;
}

function shiftMatrixRight(input: Matrix<number>): Matrix<number> {
  const matrix = shallowCopyMatrix(input);

  for (let i = 0; i < 4; i++) {
    const row = matrix[i]!;

    // Try to merge
    let canMerge = true;

    for (let j = 2; j >= 0; j--) {
      const currentTile = row[j]!;
      if (currentTile === 0) {
        continue;
      }

      let indexToMergeWith = j + 1;
      while (true) {
        if (indexToMergeWith >= 4) {
          break;
        }

        const nextTile = row[indexToMergeWith]!;

        if (canMerge && currentTile === nextTile) {
          row[j] = 0;
          row[indexToMergeWith] *= 2;
          canMerge = false;
          break;
        }
        if (nextTile > 0) {
          break;
        }

        indexToMergeWith++;
      }
    }

    // Move all to right as far as possible
    for (let j = 2; j >= 0; j--) {
      const currentTile = row[j]!;
      if (currentTile === 0) {
        continue;
      }

      let indexToMoveTo = j;

      while (true) {
        const nextTile = row[indexToMoveTo + 1]!;
        if (nextTile > 0) {
          break;
        }

        if (indexToMoveTo === 3) {
          break;
        }

        if (nextTile === 0) {
          indexToMoveTo += 1;
        }
        else {
          break;
        }
      }

      row[j] = 0;
      row[indexToMoveTo] = currentTile;

    }
  }

  return matrix;
}

export default function Game(): JSXElement {
  const [field, setField] = createSignal(createInitialField());

  function reset(): void {
    setField(createInitialField());
  }

  onMount(() => {
    const handler = (ev: KeyboardEvent) => {

      // TODO: if move changed nothing, don't spawn tile

      switch (ev.key) {
        case "ArrowUp": {
          const matrix = buildMatrix(field());
          const rotatedMatrixView = rotateMatrixClockwise(matrix);
          const shifted = shiftMatrixRight(rotatedMatrixView);
          const rotatedBack = rotateMatrixCounterClockwise(shifted);
          setField(spawnRandomTile(matrixToField(rotatedBack)));
          break;
        }
        case "ArrowDown": {
          const matrix = buildMatrix(field());
          const rotatedMatrixView = rotateMatrixClockwise(rotateMatrixClockwise(rotateMatrixClockwise(matrix)));
          const shifted = shiftMatrixRight(rotatedMatrixView);
          const rotatedBack = rotateMatrixCounterClockwise(rotateMatrixCounterClockwise(rotateMatrixCounterClockwise(shifted)));
          setField(spawnRandomTile(matrixToField(rotatedBack)));
          break;
        }
        case "ArrowRight": {
          const matrixView = buildMatrix(field());
          const shifted = shiftMatrixRight(matrixView);
          setField(spawnRandomTile(matrixToField(shifted)));
          break;
        }
        case "ArrowLeft": {
          const matrix = buildMatrix(field());
          const rotatedMatrixView = rotateMatrixClockwise(rotateMatrixClockwise(matrix));
          const shifted = shiftMatrixRight(rotatedMatrixView);
          const rotatedBack = rotateMatrixCounterClockwise(rotateMatrixCounterClockwise(shifted));
          setField(spawnRandomTile(matrixToField(rotatedBack)));
          break;
        }
      }
    }

    document.addEventListener("keydown", handler);

    onCleanup(() => {
      document.removeEventListener("keydown", handler);
    })
  })

  return <div>
    <div class="flex justify-center mb-5">
      <button class="bg-blue-500 text-white px-3 py-2 rounded" onClick={reset}>Reset</button>
    </div>
    <div
      class="select-none grid grid-cols-4 gap-2 bg-blue-100 rounded-lg p-3 max-w-sm mx-auto"
    >
      <TransitionGroup name="group-item">
        <For each={field()} fallback={<div>fallback</div>}>
          {(item) => (
            <>
              <div classList={{
                "bg-blue-200": item === 0,
                // "bg-blue-300 text-blue-800": item === 1,
                "bg-blue-400 text-blue-900": item === 1,
                "bg-indigo-300 text-indigo-800": item === 2,
                "bg-indigo-400 text-indigo-900": item === 4,
                "bg-violet-300 text-violet-800": item === 8,
                "bg-violet-400 text-violet-900": item === 16,
                "bg-purple-300 text-purple-800": item === 32,
                "bg-purple-400 text-purple-900": item === 64,
                "bg-fuchsia-300 text-fuchsia-800": item === 128,
                "bg-fuchsia-400 text-fuchsia-900": item === 256,
                "bg-pink-300 text-pink-800": item === 512,
                "bg-pink-400 text-pink-900": item === 1024,
                "bg-red-300 text-red-800": item === 2048,
              }} class="group-item rounded text-2xl font-bold flex justify-center items-center w-full aspect-ratio-square">
                <Show when={item > 0}>
                  <span>{item}</span>
                </Show>
              </div>
            </>
          )}
        </For>
      </TransitionGroup>
    </div>
  </div>
}
