import { mysqlTable, varchar, text, int, timestamp, json } from 'drizzle-orm/mysql-core';

// Stores the candidate's saved resume + display name, keyed by Clerk user ID
export const userProfiles = mysqlTable('user_profiles', {
  id: int('id').primaryKey().autoincrement(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  savedResume: text('saved_resume'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Stores each completed evaluation (resume analysis + interview report)
export const evaluations = mysqlTable('evaluations', {
  id: int('id').primaryKey().autoincrement(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull(),
  persona: varchar('persona', { length: 50 }).notNull(),
  jobDescription: text('job_description'),
  resumeSnippet: varchar('resume_snippet', { length: 500 }),
  // Full FinalReportResult stored as JSON
  reportJson: json('report_json').notNull(),
  hiringDecision: varchar('hiring_decision', { length: 20 }).notNull(),
  matchScore: int('match_score').notNull(),
  interviewScore: int('interview_score').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
