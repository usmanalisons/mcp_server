import { Prompt } from '@modelcontextprotocol/sdk/types.js';

export const codeReviewPrompt: Prompt = {
  name: 'code_review',
  description: 'Perform a comprehensive code review',
  arguments: [
    {
      name: 'code',
      description: 'Code to review',
      required: true,
    },
    {
      name: 'language',
      description: 'Programming language',
      required: false,
    },
  ],
};

export function generateCodeReviewPrompt(code: string, language?: string): string {
  return `Please perform a comprehensive code review of the following ${language || 'code'}:

\`\`\`${language || ''}
${code}
\`\`\`

Please analyze the code for:
1. **Code Quality**: Readability, maintainability, and organization
2. **Best Practices**: Following language-specific conventions and patterns
3. **Performance**: Potential optimizations and efficiency improvements
4. **Security**: Potential vulnerabilities or security concerns
5. **Error Handling**: Proper error handling and edge cases
6. **Testing**: Testability and potential test cases
7. **Documentation**: Code comments and documentation needs

Provide specific suggestions for improvement with examples where applicable.`;
}