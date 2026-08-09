import { itDevTemplate } from "./it-dev.template";
import { constructionTemplate } from "./construction.template";
import { generalPmTemplate } from "./general-pm.template";
import type { BoardTemplate } from "./types";

/// The three built-in templates, as code — these are no longer applied
/// directly to a board. They're the seed data workflowTemplate.service.ts
/// copies into each org's own WorkflowTemplate rows (once at org
/// creation, and once via the backfill script for orgs that already
/// existed when this shipped). From that point on, a board is created
/// from a WorkflowTemplate row like any other template, built-in or not
/// — see WorkflowTemplate's schema.prisma comment for why.
export const BUILT_IN_TEMPLATES = {
  IT_DEV: itDevTemplate,
  CONSTRUCTION: constructionTemplate,
  GENERAL_PM: generalPmTemplate,
} as const satisfies Record<string, BoardTemplate>;

export type BuiltInTemplateKey = keyof typeof BUILT_IN_TEMPLATES;

export type { BoardTemplate } from "./types";
