export interface HelpTopicError {
  error: string;
  cause?: string | null;
  recovery: string[];
}

export interface HelpTopic {
  topicId: string;
  title: string;
  appliesToRoles: string[];
  appliesToPages: string[];
  purpose: string;
  whenToUse: string[];
  prerequisites: string[];
  stepByStepActions: string[];
  expectedResult: string;
  commonErrorsAndRecovery: HelpTopicError[];
  relatedTopics: string[];
  lastValidatedOnUtc: string;
  validatedBy: string;
  screenshotsOrDiagrams?: string[] | null;
  knownLimitations?: string[] | null;
  escalationPath?: string | null;
  externalReferenceLinks?: string[] | null;
  siteScope?: string[] | null;
  featureFlags?: string[] | null;
}

export interface HelpApiError {
  code: string;
  message: string;
}
