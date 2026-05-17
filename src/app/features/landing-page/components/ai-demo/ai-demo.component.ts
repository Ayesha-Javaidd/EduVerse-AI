import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionTitleComponent } from '../section-title/section-title.component';
interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-ai-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-demo.component.html',
})
export class AiDemoComponent implements OnInit, OnDestroy {
  navigateToAdminSignup() {
    throw new Error('Method not implemented.');
  }
  messages: ChatMessage[] = [
    {
      type: 'user',
      content: 'Can you summarize Chapter 5 of my Data Structures course?',
      timestamp: new Date(),
    },
    {
      type: 'ai',
      content: `<strong>Chapter 5 Summary:</strong><br>
        ✓ Trees & Hierarchies: Binary trees, AVL trees, and search applications<br>
        ✓ Graph Algorithms: BFS, DFS traversal and shortest path methods<br>
        ✓ Practical Uses: Database indexing and network routing`,
      timestamp: new Date(),
    },
  ];

  aiFeatures = [
    'Personalized content recommendations based on learning patterns',
    'Adaptive quiz generation tailored to student progress',
    'Real-time learning assistance with context awareness',
    'Automated progress tracking and performance insights',
  ];

  private messageInterval?: number;

  ngOnInit() {
    this.simulateTyping();
  }

  ngOnDestroy() {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
    }
  }

  private simulateTyping() {
    setTimeout(() => {
      this.messages.push({
        type: 'user',
        content: 'Generate a practice quiz on binary trees',
        timestamp: new Date(),
      });

      setTimeout(() => {
        this.messages.push({
          type: 'ai',
          content: `<strong>Quiz Generated!</strong><br>
            • 5 multiple choice questions<br>
            • 2 coding problems<br>
            • Difficulty adapted to your performance<br><br>
            <em>Ready to start your personalized quiz?</em>`,
          timestamp: new Date(),
        });
      }, 2000);
    }, 3000);
  }
}
