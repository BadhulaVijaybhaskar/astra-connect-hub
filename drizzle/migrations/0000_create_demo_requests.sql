CREATE TABLE public.demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  interest text NOT NULL CHECK (interest IN ('voice', 'chat', 'both')),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 100),
  work_email text NOT NULL CHECK (char_length(work_email) BETWEEN 3 AND 255),
  company text NOT NULL CHECK (char_length(company) BETWEEN 1 AND 150),
  role text NOT NULL CHECK (char_length(role) BETWEEN 1 AND 100),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 5 AND 40),
  calls_per_month text,
  call_direction text,
  team_size text,
  whatsapp_conversations_per_month text,
  current_whatsapp_usage text,
  current_crm text,
  primary_goal text NOT NULL CHECK (char_length(primary_goal) BETWEEN 1 AND 500),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed'))
);
GRANT ALL ON public.demo_requests TO service_role;
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.demo_requests IS 'Private demo enquiries submitted from the public AstraConnect website; service-role access only.';