import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://dejqmsopgacdwpsftpfk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlanFtc29wZ2FjZHdwc2Z0cGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTk1OTIsImV4cCI6MjA5ODI5NTU5Mn0.7T8rXwDP0-6Oy6eMrL1McnhDCp8WPUx9-_QJGuLd1Hc"
);
