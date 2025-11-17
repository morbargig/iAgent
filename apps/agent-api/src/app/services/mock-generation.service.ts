import { Injectable } from '@nestjs/common';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

@Injectable()
export class MockGenerationService {
  async generateContextualResponse(messages: ChatMessage[]): Promise<string> {
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage.content.toLowerCase();
    const conversationContext = messages.slice(-5);

    const shouldIncludeDemo = Math.random() < 0.3;
    if (shouldIncludeDemo) {
      const demoType = Math.floor(Math.random() * 4);
      switch (demoType) {
        case 0:
          return this.getDemoTableResponse();
        case 1:
          return this.getDemoCitationResponse();
        case 2:
          return this.getDemoReportResponse();
        case 3:
          return this.getDemoMixedResponse();
      }
    }

    const hasCodeContext = conversationContext.some(m =>
      m.content.includes('```') ||
      m.content.toLowerCase().includes('code') ||
      m.content.toLowerCase().includes('function') ||
      m.content.toLowerCase().includes('typescript') ||
      m.content.toLowerCase().includes('javascript') ||
      m.content.toLowerCase().includes('react') ||
      m.content.toLowerCase().includes('nestjs')
    );

    const hasProjectContext = conversationContext.some(m =>
      m.content.toLowerCase().includes('nx') ||
      m.content.toLowerCase().includes('monorepo') ||
      m.content.toLowerCase().includes('project') ||
      m.content.toLowerCase().includes('setup')
    );

    const isFollowUp = messages.length > 1;
    const isGreeting = userContent.match(/\b(hello|hi|hey|good morning|good afternoon|start|begin)\b/);
    const isQuestion = userContent.includes('?') || userContent.match(/\b(what|how|why|when|where|can|could|would|should)\b/);
    const isProblemSolving = userContent.match(/\b(error|issue|problem|bug|fix|help|stuck|trouble)\b/);
    const isCompliment = userContent.match(/\b(good|great|nice|excellent|perfect|awesome|thanks|thank you)\b/);

    if (isGreeting && !isFollowUp) {
      return this.getGreetingResponse();
    } else if (isCompliment) {
      return this.getComplimentResponse();
    } else if (isProblemSolving) {
      return this.getProblemSolvingResponse(userContent);
    } else if (hasCodeContext || userContent.includes('code')) {
      return this.getCodeResponse(userContent);
    } else if (hasProjectContext || userContent.includes('nx') || userContent.includes('monorepo')) {
      return this.getProjectResponse(userContent);
    } else if (userContent.includes('help') || userContent.includes('how')) {
      return this.getHelpResponse(userContent);
    } else if (userContent.includes('explain') || userContent.includes('what is')) {
      return this.getExplanationResponse(userContent);
    } else if (isQuestion) {
      return this.getQuestionResponse(userContent);
    } else if (isFollowUp) {
      return this.getFollowUpResponse(userContent, conversationContext);
    } else {
      return this.getGeneralResponse(userContent);
    }
  }

  getGreetingResponse(): string {
    const greetings = [
      "Hello! I'm ChatGPT Clone, an AI assistant built with React and NestJS. I'm here to help you with coding, explanations, creative writing, and much more. What would you like to explore today?",
      "Hi there! 👋 Welcome to our ChatGPT Clone demo. I'm powered by a modern tech stack and ready to assist you. Feel free to ask me anything!",
      "Hey! Great to meet you. I'm an AI assistant that can help with programming, writing, math, and general questions. What's on your mind?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  getCodeResponse(userContent: string): string {
    const codeResponses = [
      `I'd be happy to help you with coding! Here's a practical example:

\`\`\`typescript
// Modern TypeScript with proper typing
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      data,
      status: 'success'
    };
  } catch (error) {
    return {
      data: null as T,
      status: 'error',
      message: error.message
    };
  }
}
\`\`\`

This demonstrates modern async/await patterns with TypeScript generics. The code is type-safe and handles errors gracefully.`,

      `Let me show you a clean React component pattern:

\`\`\`tsx
import React, { useState, useCallback } from 'react';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  onUpdate 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpdate = useCallback(async (updates: Partial<User>) => {
    setLoading(true);
    try {
      const updatedUser = await updateUser(userId, updates);
      setUser(updatedUser);
      onUpdate?.(updatedUser);
    } finally {
      setLoading(false);
    }
  }, [userId, onUpdate]);

  return (
    <div className="user-profile">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <UserForm user={user} onSubmit={handleUpdate} />
      )}
    </div>
  );
};
\`\`\`

This shows proper TypeScript typing, React hooks, and performance optimization with useCallback.`
    ];

    return codeResponses[Math.floor(Math.random() * codeResponses.length)];
  }

  getHelpResponse(userContent: string): string {
    return `I'm here to help! Based on your question, here are some ways I can assist:

## 💻 **Programming & Development**
- Code examples and explanations
- Debugging assistance
- Best practices and patterns
- Framework-specific guidance

## 📚 **Learning & Education**
- Step-by-step tutorials
- Concept explanations
- Problem-solving strategies

## 🛠️ **Technical Support**
- Architecture recommendations
- Performance optimization
- Tool and library suggestions

## ✍️ **Writing & Communication**
- Content creation
- Documentation help
- Technical writing

Feel free to ask specific questions, and I'll provide detailed, practical answers!`;
  }

  getExplanationResponse(userContent: string): string {
    return `Great question! Let me break this down for you:

When working with modern web development, there are several key concepts that are essential to understand:

### **Component Architecture**
Modern applications are built using a component-based approach where:
- Each component has a single responsibility
- Components communicate through props and events
- State management is handled predictably

### **Type Safety**
TypeScript provides compile-time safety by:
- Catching errors before runtime
- Providing better IDE support
- Making code more maintainable

### **Reactive Programming**
Modern frameworks use reactive patterns:
- Data flows in one direction
- State changes trigger UI updates
- Effects are managed declaratively

### **Performance Optimization**
Key strategies include:
- Code splitting and lazy loading
- Memoization and caching
- Efficient rendering patterns

Would you like me to dive deeper into any of these concepts?`;
  }

  getFollowUpResponse(userContent: string, context: ChatMessage[]): string {
    const previousMessages = context.slice(0, -1);
    const previousUserMessages = previousMessages.filter(m => m.role === 'user');
    const previousAssistantMessages = previousMessages.filter(m => m.role === 'assistant');
    
    const topics: string[] = [];
    const codeBlocks: string[] = [];
    
    previousMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      
      if (content.includes('typescript') || content.includes('javascript')) {
        topics.push('TypeScript/JavaScript');
      }
      if (content.includes('react')) {
        topics.push('React');
      }
      if (content.includes('nestjs')) {
        topics.push('NestJS');
      }
      if (content.includes('stream') || content.includes('chunk')) {
        topics.push('streaming');
      }
      if (content.includes('code') || content.includes('function')) {
        topics.push('programming');
      }
      
      const codeMatch = msg.content.match(/```[\s\S]*?```/g);
      if (codeMatch) {
        codeBlocks.push(...codeMatch);
      }
    });
    
    const uniqueTopics = [...new Set(topics)];
    const lastUserMessage = previousUserMessages[previousUserMessages.length - 1];
    const lastAssistantMessage = previousAssistantMessages[previousAssistantMessages.length - 1];
    
    let response = '';
    
    if (uniqueTopics.length > 0) {
      response += `Continuing our discussion about ${uniqueTopics.join(', ')}, `;
    } else {
      response += `Building on what we've been discussing, `;
    }
    
    if (lastUserMessage) {
      const lastUserContent = lastUserMessage.content.substring(0, 150);
      if (lastUserContent.length > 0) {
        response += `you mentioned: "${lastUserContent}${lastUserContent.length >= 150 ? '...' : ''}"\n\n`;
      }
    }
    
    if (lastAssistantMessage) {
      const lastAssistantContent = lastAssistantMessage.content.substring(0, 200);
      if (lastAssistantContent.length > 0) {
        response += `In my previous response, I covered: ${lastAssistantContent.substring(0, 100)}${lastAssistantContent.length >= 100 ? '...' : ''}\n\n`;
      }
    }
    
    const lowerContent = userContent.toLowerCase();
    
    if (lowerContent.includes('more') || lowerContent.includes('expand') || lowerContent.includes('detail')) {
      response += `Let me provide more details:\n\n`;
      
      if (codeBlocks.length > 0) {
        response += `**Code Examples:**\n`;
        response += `Here's an enhanced version of the code we discussed:\n\n`;
        response += `\`\`\`typescript\n`;
        response += `// Enhanced implementation based on our discussion\n`;
        response += `// This builds on the previous examples\n`;
        response += `\`\`\`\n\n`;
      }
      
      if (uniqueTopics.includes('streaming')) {
        response += `**Streaming Implementation:**\n`;
        response += `For the streaming functionality we discussed, here are key considerations:\n`;
        response += `- Token-by-token processing for smooth UX\n`;
        response += `- Proper error handling and recovery\n`;
        response += `- State management during streaming\n\n`;
      }
    } else if (lowerContent.includes('how') || lowerContent.includes('implement')) {
      response += `Here's how to implement this:\n\n`;
      response += `**Step-by-Step Approach:**\n`;
      response += `1. Start with the core functionality\n`;
      response += `2. Add error handling and edge cases\n`;
      response += `3. Optimize for performance\n`;
      response += `4. Test thoroughly\n\n`;
    } else if (lowerContent.includes('why') || lowerContent.includes('reason')) {
      response += `Here's the reasoning behind this approach:\n\n`;
      response += `**Why This Works:**\n`;
      response += `- It addresses the specific requirements we discussed\n`;
      response += `- It follows best practices for maintainability\n`;
      response += `- It scales well with your use case\n\n`;
    } else if (lowerContent.includes('example') || lowerContent.includes('show')) {
      response += `Here's a practical example:\n\n`;
      
      if (uniqueTopics.includes('programming') || uniqueTopics.includes('TypeScript/JavaScript')) {
        response += `\`\`\`typescript\n`;
        response += `// Example implementation\n`;
        response += `function example() {\n`;
        response += `  // Based on our conversation\n`;
        response += `  return 'implementation';\n`;
        response += `}\n`;
        response += `\`\`\`\n\n`;
      }
    } else {
      response += `Let me address your question:\n\n`;
      
      if (uniqueTopics.length > 0) {
        response += `**Regarding ${uniqueTopics[0]}:**\n`;
        response += `Based on our previous discussion, here are some additional insights:\n\n`;
      }
      
      response += `**Key Points:**\n`;
      response += `- This relates to what we covered earlier\n`;
      response += `- There are practical considerations to keep in mind\n`;
      response += `- The implementation can be tailored to your needs\n\n`;
    }
    
    response += `**Next Steps:**\n`;
    response += `Would you like me to:\n`;
    response += `- Provide more specific code examples?\n`;
    response += `- Explain any particular aspect in more detail?\n`;
    response += `- Help with implementation?\n\n`;
    response += `What would be most helpful?`;
    
    return response;
  }

  getGeneralResponse(userContent: string): string {
    const responses = [
      `That's an interesting topic! Let me share some thoughts:

Modern technology has revolutionized how we approach problem-solving. Whether you're working on:

- **Software Development**: Building scalable, maintainable applications
- **Data Analysis**: Extracting insights from complex datasets  
- **User Experience**: Creating intuitive, accessible interfaces
- **System Architecture**: Designing robust, efficient systems

The key is always to start with clear objectives and choose the right tools for the job.

What specific area interests you most?`,

      `I'd be happy to help you explore this further! Here's my perspective:

When tackling any challenge, I recommend following these principles:

1. **Understand the Problem**: Break it down into smaller, manageable parts
2. **Research Solutions**: Look at existing approaches and best practices
3. **Plan Your Approach**: Create a clear roadmap before implementation
4. **Iterate and Improve**: Test, gather feedback, and refine

This methodology works well whether you're:
- Learning a new technology
- Solving a technical problem
- Planning a project
- Making strategic decisions

What would you like to dive deeper into?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  getComplimentResponse(): string {
    const responses = [
      `Thank you! I'm glad I could help. 😊 

This project is designed to showcase how modern web technologies can work together seamlessly:

- **Frontend**: React with Material-UI for a polished interface
- **Backend**: NestJS providing robust API endpoints
- **Development**: Nx monorepo for efficient development workflow
- **Streaming**: Real-time communication with Server-Sent Events

Is there anything else you'd like to explore or any other questions I can help with?`,

      `I appreciate your kind words! 🙏

It's great to see the streaming functionality working smoothly. The combination of:
- Token-by-token streaming
- Contextual responses  
- Markdown rendering
- Responsive design

...creates a nice ChatGPT-like experience. Feel free to test out different types of questions - I can help with code examples, explanations, problem-solving, and more!`,

      `Thanks! That means a lot. ✨

This demo showcases several interesting technical concepts:
- **Real-time streaming** with controlled delays for natural flow
- **Context awareness** based on conversation history
- **Rich formatting** with markdown support
- **Modern architecture** using TypeScript throughout

What would you like to explore next?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  getProblemSolvingResponse(userContent: string): string {
    const responses = [
      `I'm here to help you troubleshoot! 🔧 Let's work through this step by step.

Common debugging approaches:

1. **Identify the Problem**: What exactly is happening vs. what you expected?
2. **Check the Basics**: 
   - Are all services running?
   - Are there any console errors?
   - Is the network connection working?
3. **Isolate the Issue**: Test components individually
4. **Review Recent Changes**: What was the last thing that worked?

For this **Nx monorepo** specifically, common issues include:
- Port conflicts between frontend/backend
- CORS configuration problems
- Build/serve command issues
- Missing dependencies

What specific error or issue are you encountering?`,

      `Let's solve this together! 🚀

Here's my **systematic debugging checklist**:

**Frontend Issues:**
- Check browser console for errors
- Verify API endpoints are correct
- Test with browser dev tools network tab

**Backend Issues:**
- Check server logs
- Verify database connections
- Test endpoints with Postman/curl

**Nx Workspace Issues:**
- Run \`nx reset\` to clear cache
- Check \`nx.json\` configuration
- Verify project dependencies

**Common Quick Fixes:**
\`\`\`bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset Nx cache
nx reset

# Check if ports are available
lsof -i :3000
lsof -i :4200
\`\`\`

What's the specific issue you're facing?`
    ];

    return responses[Math.floor(Math.random() * responses.length)] as string;
  }

  getProjectResponse(userContent: string): string {
    const responses = [
      `Great question about the **Nx monorepo setup**! 📁

This project structure demonstrates several best practices:

## **Project Architecture:**
\`\`\`
iagent/
├── apps/
│   ├── backend/     # NestJS API server
│   ├── agent-api/  # Agent API for streaming
│   └── frontend/    # React application
├── libs/            # Shared libraries
└── tools/           # Development tools
\`\`\`

## **Key Benefits:**
- **Code Sharing**: Common utilities, types, and components
- **Unified Tooling**: Single place for linting, testing, building
- **Dependency Management**: Consistent versions across apps
- **Development Efficiency**: Fast rebuilds with intelligent caching

## **Available Commands:**
\`\`\`bash
# Development
nx serve backend        # Start Backend server (port 3030)
nx serve agent-api  # Start Agent API (port 3033)
nx serve frontend   # Start React app (port 4200)

# Building
nx build backend
nx build agent-api
nx build frontend

# Testing
nx test backend
nx test agent-api
nx test frontend
\`\`\`

What aspect of the Nx setup interests you most?`,

      'Excellent! You\'re asking about the **monorepo architecture**. 🏗️\n\n' +
      'This setup showcases how to organize a **full-stack TypeScript application**:\n\n' +
      '### **Backend (NestJS):**\n' +
      '- RESTful API with /api prefix\n' +
      '- Server-Sent Events for streaming\n' +
      '- Swagger documentation at /api/docs\n' +
      '- CORS enabled for frontend communication\n\n' +
      '### **Frontend (React):**\n' +
      '- Modern React 19 with hooks\n' +
      '- Material-UI components\n' +
      '- Real-time streaming integration\n' +
      '- Responsive ChatGPT-like interface\n\n' +
      '### **Development Workflow:**\n' +
      '1. **Start all apps**: nx run-many --target=serve --projects=backend,agent-api,frontend\n' +
      '2. **Parallel development**: Changes auto-reload\n' +
      '3. **Shared types**: Type safety across frontend/backend\n' +
      '4. **Consistent tooling**: Same ESLint, Prettier, Jest config\n\n' +
      '### **Production Ready:**\n' +
      '- Built with nx build for optimized bundles\n' +
      '- Environment-specific configurations\n' +
      '- Docker-ready setup\n\n' +
      'Want to know more about any specific part?'
    ];

    return responses[Math.floor(Math.random() * responses.length)] as string;
  }

  getQuestionResponse(userContent: string): string {
    const responses = [
      'That\'s a thoughtful question! 🤔 Let me provide a comprehensive answer:\n\n' +
      'The approach depends on what you\'re trying to accomplish. In general, I recommend:\n\n' +
      '**For Learning:**\n' +
      '- Start with the fundamentals\n' +
      '- Practice with small projects\n' +
      '- Build up complexity gradually\n' +
      '- Learn from real-world examples (like this project!)\n\n' +
      '**For Problem Solving:**\n' +
      '- Break the problem into smaller parts\n' +
      '- Research existing solutions\n' +
      '- Prototype quickly\n' +
      '- Iterate based on feedback\n\n' +
      '**For This Demo Specifically:**\n' +
      '- Explore the codebase structure\n' +
      '- Test different input types\n' +
      '- Check out the Swagger docs at /api/docs\n' +
      '- Try the streaming functionality\n\n' +
      'What specific aspect would you like me to elaborate on?',

      'Interesting question! 💭 Here\'s how I\'d approach it:\n\n' +
      '**Context Matters:** The best solution depends on:\n' +
      '- Your specific use case\n' +
      '- Available resources and constraints\n' +
      '- Timeline and complexity requirements\n' +
      '- Team expertise and preferences\n\n' +
      '**For Web Development Projects:**\n' +
      '1. **Choose the right stack** (like React + NestJS here)\n' +
      '2. **Plan your architecture** (monorepo vs separate repos)\n' +
      '3. **Set up good development practices** (linting, testing, CI/CD)\n' +
      '4. **Focus on user experience** (responsive design, performance)\n\n' +
      '**For This Type of Chat Application:**\n' +
      '- **Real-time communication** (WebSockets or SSE)\n' +
      '- **State management** (context, reducers, or external libraries)\n' +
      '- **Error handling** (graceful degradation)\n' +
      '- **Accessibility** (keyboard navigation, screen readers)\n\n' +
      'Would you like me to dive deeper into any of these areas?'
    ];

    return responses[Math.floor(Math.random() * responses.length)] as string;
  }

  generateToolTSection(): string {
    const contentTypes = ['table', 'citation', 'report', 'table'];
    const selectedType = contentTypes[Math.floor(Math.random() * contentTypes.length)];

    if (selectedType === 'table') {
      return `## Tool T Analysis Results

Here's a detailed comparison table from Tool T:

table: Tool T Performance Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Response Time | 120ms | <150ms | ✅ Pass |
| Throughput | 850 req/s | >800 req/s | ✅ Pass |
| Error Rate | 0.2% | <1% | ✅ Pass |
| CPU Usage | 45% | <60% | ✅ Pass |

### Key Findings

> "Tool T demonstrates excellent performance characteristics with all metrics meeting or exceeding targets. The response time is particularly impressive given the complexity of operations."

This analysis shows Tool T is performing well across all measured dimensions.`;
    } else if (selectedType === 'citation') {
      return `## Tool T Research Summary

> "Tool T leverages advanced algorithms to optimize processing efficiency. The implementation follows industry best practices for scalability and reliability."

### Analysis Details

Based on extensive testing, Tool T shows:

- **Efficiency**: 95% improvement over baseline
- **Reliability**: 99.8% uptime
- **Scalability**: Handles 10x load increase

> "The results demonstrate Tool T's capability to handle production workloads effectively while maintaining high quality standards."

These findings support the recommendation to deploy Tool T in production environments.`;
    } else if (selectedType === 'report') {
      return `## Tool T Execution Report

Tool T has completed its analysis and generated the following report:

report: {
  "reportId": "tool-t-analysis-2024-001",
  "title": "Tool T Performance Analysis Report",
  "summary": "Comprehensive analysis of Tool T performance metrics, efficiency improvements, and scalability assessment",
  "metadata": {
    "date": "2024-01-15",
    "category": "performance",
    "priority": "high",
    "tool": "tool-t",
    "executionTime": "2.5s"
  }
}

### Report Highlights

The report contains detailed insights into Tool T's performance characteristics, including:

- Performance benchmarks
- Efficiency metrics
- Scalability analysis
- Recommendations for optimization

This report provides comprehensive documentation of Tool T's capabilities and performance.`;
    } else if (selectedType === 'citation') {
      return `## Tool T Research Summary

Based on the analysis shown in [table-1], Tool T demonstrates excellent performance.

> "Tool T leverages advanced algorithms to optimize processing efficiency. The implementation follows industry best practices for scalability and reliability."

### Analysis Details

The data in [table-1] shows:

- **Efficiency**: 95% improvement over baseline
- **Reliability**: 99.8% uptime
- **Scalability**: Handles 10x load increase

table-citation: table-1
table: Tool T Performance Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Response Time | 120ms | <150ms | ✅ Pass |
| Throughput | 850 req/s | >800 req/s | ✅ Pass |
| Error Rate | 0.2% | <1% | ✅ Pass |
| CPU Usage | 45% | <60% | ✅ Pass |

> "The results demonstrate Tool T's capability to handle production workloads effectively while maintaining high quality standards."

These findings support the recommendation to deploy Tool T in production environments.`;
    }

    return `## Tool T Results

Tool T has completed its analysis. Here are the findings:

table: Tool T Summary

| Category | Count | Status |
|----------|-------|--------|
| Processed | 1,234 | Complete |
| Errors | 2 | Resolved |
| Warnings | 5 | Reviewed |

> "Tool T successfully processed all items with minimal issues. The error rate is well within acceptable limits."

The analysis is complete and ready for review.`;
  }

  generateToolHSection(): string {
    const contentTypes = ['table', 'citation', 'report'];
    const selectedType = contentTypes[Math.floor(Math.random() * contentTypes.length)];

    if (selectedType === 'table') {
      return `## Tool H Execution Report

Tool H has generated the following analysis:

table: Tool H Data Analysis

| Dataset | Records | Processed | Quality Score |
|---------|---------|-----------|---------------|
| Dataset A | 5,432 | 5,430 | 98.5% |
| Dataset B | 3,210 | 3,208 | 97.2% |
| Dataset C | 8,765 | 8,763 | 99.1% |

### Summary

> "Tool H processed all datasets successfully with high quality scores. The processing pipeline demonstrates robust error handling and data validation."

All datasets have been processed and validated.`;
    } else if (selectedType === 'citation') {
      return `## Tool H Research Findings

> "Tool H implements a sophisticated data processing pipeline that ensures high accuracy and reliability. The architecture supports concurrent processing of multiple datasets."

### Performance Metrics

- **Processing Speed**: 2.5x faster than previous version
- **Accuracy**: 99.2% across all test cases
- **Resource Usage**: 30% reduction in memory consumption

> "These improvements make Tool H suitable for production deployment at scale. The reduced resource usage is particularly beneficial for cost optimization."

Tool H is ready for production use.`;
    } else {
      return `## Tool H Analysis Complete

Tool H has completed comprehensive analysis and generated a detailed report:

report: {
  "reportId": "tool-h-execution-2024-001",
  "title": "Tool H Data Processing Report",
  "summary": "Complete analysis of Tool H data processing capabilities, quality metrics, and performance benchmarks",
  "metadata": {
    "date": "2024-01-15",
    "category": "data-processing",
    "priority": "medium",
    "tool": "tool-h",
    "executionTime": "3.2s",
    "datasetsProcessed": 3
  }
}

### Report Contents

The report includes:

table: Tool H Results Summary

| Test Case | Result | Duration | Notes |
|-----------|--------|----------|-------|
| Unit Tests | ✅ Pass | 45s | All 234 tests passed |
| Integration | ✅ Pass | 2m 15s | No issues detected |
| Performance | ✅ Pass | 5m 30s | Within targets |

> "Tool H demonstrates excellent test coverage and performance characteristics. All test suites passed without issues."

The analysis confirms Tool H meets all quality requirements.`;
    }
  }

  generateToolFSection(): string {
    const contentTypes = ['table', 'citation', 'report'];
    const selectedType = contentTypes[Math.floor(Math.random() * contentTypes.length)];

    if (selectedType === 'table') {
      return `## Tool F Execution Report

Tool F has generated the following analysis:

table: Tool F Data Analysis

| Dataset | Records | Processed | Quality Score |
|---------|---------|-----------|---------------|
| Dataset A | 5,432 | 5,430 | 98.5% |
| Dataset B | 3,210 | 3,208 | 97.2% |
| Dataset C | 8,765 | 8,763 | 99.1% |

### Summary

> "Tool F processed all datasets successfully with high quality scores. The processing pipeline demonstrates robust error handling and data validation."

All datasets have been processed and validated.`;
    } else if (selectedType === 'citation') {
      return `## Tool F Research Findings

> "Tool F implements a sophisticated data processing pipeline that ensures high accuracy and reliability. The architecture supports concurrent processing of multiple datasets."

### Performance Metrics

- **Processing Speed**: 2.5x faster than previous version
- **Accuracy**: 99.2% across all test cases
- **Resource Usage**: 30% reduction in memory consumption

> "These improvements make Tool F suitable for production deployment at scale. The reduced resource usage is particularly beneficial for cost optimization."

Tool F is ready for production use.`;
    } else {
      return `## Tool F Analysis Complete

Tool F has completed comprehensive analysis and generated a detailed report:

report: {
  "reportId": "tool-f-execution-2024-001",
  "title": "Tool F Data Processing Report",
  "summary": "Complete analysis of Tool F data processing capabilities, quality metrics, and performance benchmarks",
  "metadata": {
    "date": "2024-01-15",
    "category": "data-processing",
    "priority": "medium",
    "tool": "tool-f",
    "executionTime": "3.2s",
    "datasetsProcessed": 3
  }
}

### Report Contents

The report includes:

table: Tool F Results Summary

| Test Case | Result | Duration | Notes |
|-----------|--------|----------|-------|
| Unit Tests | ✅ Pass | 45s | All 234 tests passed |
| Integration | ✅ Pass | 2m 15s | No issues detected |
| Performance | ✅ Pass | 5m 30s | Within targets |

> "Tool F demonstrates excellent test coverage and performance characteristics. All test suites passed without issues."

The analysis confirms Tool F meets all quality requirements.`;
    }
  }

  getDemoTableResponse(): string {
    return `Here's a comparison table showing different approaches:

table: Performance Comparison

| Approach | Speed | Complexity | Maintainability |
|----------|-------|------------|-----------------|
| Option A | Fast | Low | High |
| Option B | Medium | Medium | Medium |
| Option C | Slow | High | Low |

This table helps visualize the trade-offs between different solutions.`;
  }

  getDemoCitationResponse(): string {
    return `Here's an important citation (ציטוט):

> "The best code is code that you don't have to write. The second best is code that is easy to read and understand."

This principle guides modern software development practices.`;
  }

  getDemoReportResponse(): string {
    return `Here's a detailed report:

report: {
  "id": "report-demo-001",
  "title": "System Performance Analysis",
  "summary": "Comprehensive analysis of system metrics and recommendations",
  "metadata": {
    "date": "2024-01-15",
    "category": "performance",
    "priority": "high"
  }
}

This report contains detailed insights and recommendations.`;
  }

  getDemoMixedResponse(): string {
    return `Let me show you a comprehensive example with multiple content types:

## Analysis Results

Here's a citation (ציטוט) from a recent study:

> "Modern web applications require careful consideration of performance, maintainability, and user experience."

### Data Comparison

table: Feature Comparison

| Feature | Version 1 | Version 2 | Version 3 |
|---------|----------|-----------|-----------|
| Speed | 100ms | 80ms | 60ms |
| Memory | 50MB | 45MB | 40MB |
| Complexity | Low | Medium | High |

### Summary Report

report: {
  "id": "mixed-demo-001",
  "title": "Comprehensive Analysis",
  "summary": "Combined analysis with citations and tables",
  "metadata": {
    "type": "mixed",
    "sections": ["citation", "table", "report"]
  }
}

This demonstrates how different content types work together.`;
  }
}

