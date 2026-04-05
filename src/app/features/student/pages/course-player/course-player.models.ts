export interface ChatMessage {
  sender: 'AI' | 'Student';
  text: string;
  time: Date;
}

export interface CoursePlayerLesson {
  id?: string;
  _id?: string;
  title?: string;
  type?: string;
  content?: string;
  description?: string;
  duration?: string;
  moduleIndex?: number;
}

export interface AdaptiveLesson {
  id?: string;
  lessonId?: string;
  sourceTopic?: string;
  generationType?: string;
  title?: string;
  content?: string;
}

export interface CoursePlayerPreferences {
  isSidebarOpen: boolean;
  isAiAssistantOpen: boolean;
  aiAssistantWidth: number;
}

export interface QuizSubmissionResponse {
  percentage?: number;
}
