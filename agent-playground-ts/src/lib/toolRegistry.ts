import type { ToolDefinition } from '../types.js';
import { summarizeToolDef } from '../tools/summarizeText.js';
import { readNoteToolDef } from '../tools/readLocalNote.js';
import { echoBackToolDef } from '../tools/echoBack.js';

export const defaultRegistry: ToolDefinition[] = [
  summarizeToolDef,
  readNoteToolDef,
  echoBackToolDef,
]; // 默认工具注册表，包含三个工具
