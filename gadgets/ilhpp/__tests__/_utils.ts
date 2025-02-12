import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import less from 'less';
import { build } from 'esbuild';

let cachedCSS: string;

async function getMockupCSS(): Promise<string> {
  if (cachedCSS) {
    return cachedCSS;
  }

  const lessContent = (await readFile(`${import.meta.dirname}/../styles/mockup.less`)).toString();
  const parsed = await less.render(lessContent, { paths: [`${import.meta.dirname}/../styles`] });
  cachedCSS = parsed.css;
  return parsed.css;
}

let cachedJS: string;

async function getMockupJS(): Promise<string> {
  if (cachedJS) {
    return cachedJS;
  }

  const result = await build({
    entryPoints: [`${import.meta.dirname}/_mockup.ts`],
    banner: {
      // Import requirejs to global scope
      js: (
        await readFile(createRequire(import.meta.url).resolve('requirejs/require.js'))
      ).toString(),
    },
    bundle: true,
    minify: false,
    sourcemap: false,
    write: false,
    format: 'iife',
    target: 'esnext',
  });

  cachedJS = result.outputFiles[0].text;
  return cachedJS;
}

type CartesianProduct<T> = {
  [K in keyof T]: T[K] extends (infer U)[] ? U : never;
}[];

/**
 * Transform e.g. `{ a: [1, 2], b: [3, 4] }` to `[{ a: 1, b: 3 }, { a: 1, b: 4 }, { a: 2, b: 3 }, { a: 2, b: 4 }]`.
 * @param keyValuesMap
 * @returns
 */
function getCartesianProduct<T extends Record<string, unknown[]>>(
  keyValuesMap: T,
): CartesianProduct<T> {
  const keys = Object.keys(keyValuesMap);

  if (keys.length === 0) {
    return [];
  }
  const firstKey = keys[0];
  if (keys.length === 1) {
    return keyValuesMap[firstKey].map((val) => ({ [firstKey]: val })) as CartesianProduct<T>;
  }

  const keyValuesMapClone = { ...keyValuesMap };
  delete keyValuesMapClone[firstKey];
  const cartesianProductWithoutFirstKey = getCartesianProduct(keyValuesMapClone);

  return keyValuesMap[firstKey].flatMap((val) =>
    cartesianProductWithoutFirstKey.map((combination) => ({
      [firstKey]: val,
      ...combination,
    })),
  );
}

export { getMockupCSS, getMockupJS, getCartesianProduct };
