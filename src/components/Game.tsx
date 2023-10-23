import { createEffect, createSignal, For, Show, type JSXElement, onMount, onCleanup } from "solid-js";
import { TransitionGroup } from "solid-transition-group";

type Tile = {
  value: number;
}

const box = (x: number): Tile => ({ value: x })

function spawnRandomTile(arr: Tile[], count = 1): Tile[] {
  const copy = [...arr];

  let created = 0;

  while (created < count) {
    if (copy.every(x => x.value > 0)) {
      return copy;
    }

    const idx = Math.floor(Math.random() * copy.length);
    if (copy[idx]!.value > 0) {
      continue;
    }

    copy[idx] = box(Math.random() > 0.5 ? 2 : 4);
    created++;
  }

  return copy;
}

function createInitialField(): Tile[] {
  const field = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map(_ => box(0));
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

function rotateMatrixClockwise<T>(matrix: Matrix<T>): Matrix<T> {
  const copy = shallowCopyMatrix(matrix);

  matrix.forEach((row, i) => {
    row.forEach((value, j) => {
      copy[j]![4 - 1 - i] = value;
    });
  });

  return copy as Matrix<T>;
}

function rotateMatrixCounterClockwise<T>(matrix: Matrix<T>): Matrix<T> {
  const copy = shallowCopyMatrix(matrix);

  matrix.forEach((row, i) => {
    row.forEach((value, j) => {
      copy[4 - 1 - j]![i] = value;
    });
  });

  return copy as Matrix<T>;
}

function shiftMatrixRight(input: Matrix<Tile>, addScore: (x: number) => void): Matrix<Tile> {
  const matrix = shallowCopyMatrix(input);

  for (let i = 0; i < 4; i++) {
    const row = matrix[i]!;

    // Try to merge
    let canMerge = true;

    for (let j = 2; j >= 0; j--) {
      const currentTile = row[j]!;
      if (currentTile.value === 0) {
        continue;
      }

      let indexToMergeWith = j + 1;
      while (true) {
        if (indexToMergeWith >= 4) {
          break;
        }

        const nextTile = row[indexToMergeWith]!;

        if (canMerge && currentTile.value === nextTile.value) {
          row[j] = box(0);
          row[indexToMergeWith] = box(currentTile.value * 2);
          canMerge = false;
          addScore(currentTile.value * 2);
          break;
        }
        if (nextTile.value > 0) {
          break;
        }

        indexToMergeWith++;
      }
    }

    // Move all to right as far as possible
    for (let j = 2; j >= 0; j--) {
      const currentTile = row[j]!;
      if (currentTile.value === 0) {
        continue;
      }

      let indexToMoveTo = j;

      while (true) {
        const nextTile = row[indexToMoveTo + 1];

        if (!nextTile) {
          break;
        }

        if (nextTile.value > 0) {
          break;
        }

        if (indexToMoveTo === 3) {
          break;
        }

        if (nextTile.value === 0) {
          indexToMoveTo += 1;
        }
        else {
          break;
        }
      }

      row[j] = box(0);
      row[indexToMoveTo] = currentTile;
    }
  }

  return matrix;
}

function fieldsAreEqual(a: Tile[], b: Tile[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((a, i) => b[i]!.value === a.value);
}

export default function Game(): JSXElement {
  const [field, setField] = createSignal(createInitialField());
  const [hasWon, setWin] = createSignal(false);
  const [score, setScore] = createSignal(0);

  function addScore(points: number): void {
    setScore(x => x + points);
  }

  function reset(): void {
    setField(createInitialField());
    setWin(false);
    setScore(0);
  }

  createEffect(() => {
    if (field().some(x => x.value === 2_048)) {
      setWin(true);
    }
  });

  onMount(() => {
    const handler = (ev: KeyboardEvent) => {
      if (hasWon()) {
        return;
      }

      let deltaScore = 0;

      function onMove(nextField: Tile[]) {
        if (fieldsAreEqual(field(), nextField)) {
          return;
        }

        setField(spawnRandomTile(nextField));
        addScore(deltaScore);
      }

      switch (ev.key) {
        case "ArrowUp": {
          const matrix = buildMatrix(field());
          const rotatedMatrixView = rotateMatrixClockwise(matrix);
          const shifted = shiftMatrixRight(rotatedMatrixView, (n) => deltaScore += n);
          const rotatedBack = rotateMatrixCounterClockwise(shifted);
          const nextField = matrixToField(rotatedBack);
          onMove(nextField);
          break;
        }
        case "ArrowDown": {
          const matrix = buildMatrix(field());
          const rotatedMatrixView = rotateMatrixClockwise(rotateMatrixClockwise(rotateMatrixClockwise(matrix)));
          const shifted = shiftMatrixRight(rotatedMatrixView, (n) => deltaScore += n);
          const rotatedBack = rotateMatrixCounterClockwise(rotateMatrixCounterClockwise(rotateMatrixCounterClockwise(shifted)));
          const nextField = matrixToField(rotatedBack);
          onMove(nextField);
          break;
        }
        case "ArrowRight": {
          const matrixView = buildMatrix(field());
          const shifted = shiftMatrixRight(matrixView, (n) => deltaScore += n);
          const nextField = matrixToField(shifted);
          onMove(nextField);
          break;
        }
        case "ArrowLeft": {
          const matrix = buildMatrix(field());
          const rotatedMatrixView = rotateMatrixClockwise(rotateMatrixClockwise(matrix));
          const shifted = shiftMatrixRight(rotatedMatrixView, (n) => deltaScore += n);
          const rotatedBack = rotateMatrixCounterClockwise(rotateMatrixCounterClockwise(shifted));
          const nextField = matrixToField(rotatedBack);
          onMove(nextField);
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
    <div class="text-center mb-5">
      <button class="text-lg font-medium text-blue-500" onClick={reset}>Score: {score()}</button>
    </div>
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
                "bg-blue-200": item.value === 0,
                "bg-blue-400 text-blue-900": item.value === 1,
                "bg-indigo-300 text-indigo-800": item.value === 2,
                "bg-indigo-400 text-indigo-900": item.value === 4,
                "bg-violet-300 text-violet-800": item.value === 8,
                "bg-violet-400 text-violet-900": item.value === 16,
                "bg-purple-300 text-purple-800": item.value === 32,
                "bg-purple-400 text-purple-900": item.value === 64,
                "bg-fuchsia-300 text-fuchsia-800": item.value === 128,
                "bg-fuchsia-400 text-fuchsia-900": item.value === 256,
                "bg-pink-300 text-pink-800": item.value === 512,
                "bg-pink-400 text-pink-900": item.value === 1_024,
                "bg-red-300 text-red-800": item.value === 2_048,
              }} class="group-item rounded text-2xl font-bold flex justify-center items-center w-full aspect-ratio-square">
                <Show when={item.value > 0}>
                  <span>{item.value}</span>
                </Show>
              </div>
            </>
          )}
        </For>
      </TransitionGroup>
    </div>
    <Show when={hasWon()}>
      <div class="text-xl text-blue-500 font-semibold text-center mt-5">
        You have won!!!
      </div>
    </Show>
  </div>
}
