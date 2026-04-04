import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingpageHeaderComponent } from '../../landing-page/components/landingpage-header/landingpage-header.component';
import { FooterComponent } from '../../landing-page/components/footer/footer.component';

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [CommonModule, LandingpageHeaderComponent, FooterComponent],
  templateUrl: './help-center.component.html',
})
export class HelpCenterComponent {
  faqs = [
    {
      question: 'How do I register my institution on EduVerse?',
      answer: 'Click "Register your Organization" on the homepage and fill in your details including organization name, admin contact information, and logo. Once submitted, your multi-tenant workspace will be provisioned automatically.',
      open: false
    },
    {
      question: 'How do students join a course?',
      answer: 'Students can browse available courses in the "Explore Courses" section once logged in. Click on a course to view its details, then click "Enroll" to join. Your admin or teacher may also send you a direct enrollment link.',
      open: false
    },
    {
      question: 'How does the AI Learning Assistant work?',
      answer: 'Our AI assistant is powered by LangChain and large language models (LLMs). It provides personalized tutoring by analyzing your learning patterns, generating adaptive quizzes, summarizing course content, and offering real-time help within your learning workflow.',
      open: false
    },
    {
      question: 'Can teachers create quizzes automatically?',
      answer: 'Yes! Teachers can use the AI-powered quiz generator to create quizzes based on course content. The system analyzes the material and generates multiple-choice questions, coding problems, and short-answer questions adapted to student performance levels.',
      open: false
    },
    {
      question: 'How are teachers added to the platform?',
      answer: 'Teachers are invited by the institution admin through the Admin Dashboard. Navigate to the Teachers section and add teachers by providing their email addresses. They will receive an invitation to join the platform.',
      open: false
    },
    {
      question: 'Is my data isolated from other institutions?',
      answer: 'Absolutely. EduVerse uses a multi-tenant architecture with complete data isolation. Each institution operates in its own secure environment — students, courses, and analytics from one organization are never visible to another.',
      open: false
    },
    {
      question: 'What subscription plans are available?',
      answer: 'We offer three plans: Starter ($49/mo) for small coaching centers, Professional ($99/mo) for growing schools with advanced AI features, and Enterprise ($249/mo) for universities with unlimited students and custom LLM fine-tuning.',
      open: false
    },
    {
      question: 'How do I reset my password?',
      answer: 'Click "Forgot password?" on the Sign In page. Enter your registered email address and we will send you a password reset link. The link is valid for 24 hours.',
      open: false
    }
  ];

  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }
}
