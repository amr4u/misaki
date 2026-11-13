import { learningDefs } from './learning-tools.mjs';
export const toolDefs = [{
  name: 'misaki_save_record',
  description: 'Save one Japanese translation or correction (user original input and complete Misaki response). Call after preparing the answer. Use the same request_id if retrying the same event. Never claim saved unless returned success.',
  inputSchema: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Original user message'
      },
      response: {
        type: 'string',
        description: 'Full Japanese translation or correction response'
      },
      request_id: {
        type: 'string',
        description: 'Stable unique 8-128-character ID for this conversation turn; reuse only when retrying'
      }
    },
    required: ['input', 'response', 'request_id'],
    additionalProperties: false
  }
}, {
  name: 'misaki_list_records',
  description: 'List saved original messages and responses for nanami to inspect; newest first. Supports pagination and an optional UTC since filter.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100
      },
      offset: {
        type: 'integer',
        minimum: 0,
        maximum: 100000
      },
      since: {
        type: 'string'
      }
    },
    additionalProperties: false
  }
}, {
  name: 'misaki_get_record',
  description: 'Retrieve one exact saved record by ID.',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string'
      }
    },
    required: ['id'],
    additionalProperties: false
  }
}, {
  name: 'misaki_delete_record',
  description: 'Permanently delete one record by ID. Only invoke when user explicitly requests deletion.',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string'
      },
      confirm: {
        type: 'boolean',
        description: 'Must be true after explicit user deletion request'
      }
    },
    required: ['id', 'confirm'],
    additionalProperties: false
  }
}, {
  name: 'misaki_export_records',
  description: 'Read original records in pages for backup or analysis, max 100 per page.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100
      },
      offset: {
        type: 'integer',
        minimum: 0,
        maximum: 100000
      }
    },
    additionalProperties: false
  }
}];
for (const tool of toolDefs) {
  const readonly = ['misaki_list_records', 'misaki_get_record', 'misaki_export_records'].includes(tool.name);
  tool.annotations = {
    readOnlyHint: readonly,
    destructiveHint: tool.name === 'misaki_delete_record',
    idempotentHint: true,
    openWorldHint: false
  };
}
toolDefs.push(...learningDefs);
