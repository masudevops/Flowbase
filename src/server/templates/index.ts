import { itDevTemplate } from "./it-dev.template";
import { constructionTemplate } from "./construction.template";
import type { BoardTemplate } from "./types";

export const BOARD_TEMPLATES = {
  IT_DEV: itDevTemplate,
  CONSTRUCTION: constructionTemplate,
} as const satisfies Record<string, BoardTemplate>;

export type TemplateKey = keyof typeof BOARD_TEMPLATES;

export function isTemplateKey(value: string): value is TemplateKey {
  return value in BOARD_TEMPLATES;
}

export type { BoardTemplate } from "./types";
