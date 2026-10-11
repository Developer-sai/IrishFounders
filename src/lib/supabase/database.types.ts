
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admin_audit_logs": {
                  Row: {
                    "action": string,"admin_id": string | null,"created_at": string,"details": NonNullable<Json>,"id": string,"target_id": string | null,"target_table": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"admin_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"id"?: string,"target_id"?: string | null,"target_table": string
                  }
                  Update: {
                    "action"?: string,"admin_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"id"?: string,"target_id"?: string | null,"target_table"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_audit_logs_admin_id_fkey"
      columns: ["admin_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "admin_audit_logs_admin_id_fkey"
      columns: ["admin_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "admin_audit_logs_admin_id_fkey"
      columns: ["admin_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"blocks": {
                  Row: {
                    "blocked_id": string,"blocker_id": string,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "blocked_id": string,"blocker_id": string,"created_at"?: string
                  }
                  Update: {
                    "blocked_id"?: string,"blocker_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "blocks_blocked_id_fkey"
      columns: ["blocked_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "blocks_blocked_id_fkey"
      columns: ["blocked_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "blocks_blocked_id_fkey"
      columns: ["blocked_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "blocks_blocker_id_fkey"
      columns: ["blocker_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "blocks_blocker_id_fkey"
      columns: ["blocker_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "blocks_blocker_id_fkey"
      columns: ["blocker_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"collaboration_listings": {
                  Row: {
                    "category": string,"commitment_type": string,"created_at": string,"creator_id": string,"description": string,"id": string,"industry": string | null,"is_active": boolean,"location": string | null,"skills_needed": (string)[],"startup_id": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"commitment_type": string,"created_at"?: string,"creator_id": string,"description": string,"id"?: string,"industry"?: string | null,"is_active"?: boolean,"location"?: string | null,"skills_needed"?: (string)[],"startup_id"?: string | null,"title": string
                  }
                  Update: {
                    "category"?: string,"commitment_type"?: string,"created_at"?: string,"creator_id"?: string,"description"?: string,"id"?: string,"industry"?: string | null,"is_active"?: boolean,"location"?: string | null,"skills_needed"?: (string)[],"startup_id"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "collaboration_listings_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "collaboration_listings_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "collaboration_listings_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "collaboration_listings_startup_id_fkey"
      columns: ["startup_id"]
isOneToOne: false
      referencedRelation: "startups"
      referencedColumns: ["id"]
    }
                  ]
                },"connections": {
                  Row: {
                    "created_at": string,"id": string,"recipient_id": string,"requester_id": string,"status": Database["public"]['Enums']["connection_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"recipient_id": string,"requester_id": string,"status"?: Database["public"]['Enums']["connection_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"recipient_id"?: string,"requester_id"?: string,"status"?: Database["public"]['Enums']["connection_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "connections_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "connections_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "connections_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "connections_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "connections_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "connections_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"conversations": {
                  Row: {
                    "created_at": string,"id": string,"last_message_at": string,"participant_one": string,"participant_two": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"last_message_at"?: string,"participant_one": string,"participant_two": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"last_message_at"?: string,"participant_one"?: string,"participant_two"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversations_participant_one_fkey"
      columns: ["participant_one"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_participant_one_fkey"
      columns: ["participant_one"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_participant_one_fkey"
      columns: ["participant_one"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "conversations_participant_two_fkey"
      columns: ["participant_two"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_participant_two_fkey"
      columns: ["participant_two"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_participant_two_fkey"
      columns: ["participant_two"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"design_partner_applications": {
                  Row: {
                    "applicant_id": string,"created_at": string,"id": string,"message": string,"request_id": string,"status": Database["public"]['Enums']["request_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "applicant_id": string,"created_at"?: string,"id"?: string,"message": string,"request_id": string,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Update: {
                    "applicant_id"?: string,"created_at"?: string,"id"?: string,"message"?: string,"request_id"?: string,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "design_partner_applications_applicant_id_fkey"
      columns: ["applicant_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "design_partner_applications_applicant_id_fkey"
      columns: ["applicant_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "design_partner_applications_applicant_id_fkey"
      columns: ["applicant_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "design_partner_applications_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "design_partner_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"design_partner_requests": {
                  Row: {
                    "created_at": string,"deadline": string | null,"expected_commitment": string,"feedback_type": string,"founder_id": string,"id": string,"is_active": boolean,"partners_needed": number,"problem_statement": string,"product_name": string | null,"startup_id": string,"target_user": string,"title": string,"work_mode": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deadline"?: string | null,"expected_commitment": string,"feedback_type": string,"founder_id": string,"id"?: string,"is_active"?: boolean,"partners_needed"?: number,"problem_statement": string,"product_name"?: string | null,"startup_id": string,"target_user": string,"title": string,"work_mode"?: string
                  }
                  Update: {
                    "created_at"?: string,"deadline"?: string | null,"expected_commitment"?: string,"feedback_type"?: string,"founder_id"?: string,"id"?: string,"is_active"?: boolean,"partners_needed"?: number,"problem_statement"?: string,"product_name"?: string | null,"startup_id"?: string,"target_user"?: string,"title"?: string,"work_mode"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "design_partner_requests_founder_id_fkey"
      columns: ["founder_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "design_partner_requests_founder_id_fkey"
      columns: ["founder_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "design_partner_requests_founder_id_fkey"
      columns: ["founder_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "design_partner_requests_startup_id_fkey"
      columns: ["startup_id"]
isOneToOne: false
      referencedRelation: "startups"
      referencedColumns: ["id"]
    }
                  ]
                },"interviews": {
                  Row: {
                    "answers": NonNullable<Json>,"application_id": string,"created_at": string,"id": string,"internal_notes": string | null,"interview_type": string,"interviewer_id": string | null,"meeting_link": string | null,"outcome_recommendation": string | null,"scheduled_at": string | null,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"application_id": string,"created_at"?: string,"id"?: string,"internal_notes"?: string | null,"interview_type"?: string,"interviewer_id"?: string | null,"meeting_link"?: string | null,"outcome_recommendation"?: string | null,"scheduled_at"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"application_id"?: string,"created_at"?: string,"id"?: string,"internal_notes"?: string | null,"interview_type"?: string,"interviewer_id"?: string | null,"meeting_link"?: string | null,"outcome_recommendation"?: string | null,"scheduled_at"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "interviews_application_id_fkey"
      columns: ["application_id"]
isOneToOne: true
      referencedRelation: "membership_applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "interviews_interviewer_id_fkey"
      columns: ["interviewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "interviews_interviewer_id_fkey"
      columns: ["interviewer_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "interviews_interviewer_id_fkey"
      columns: ["interviewer_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"investor_introductions": {
                  Row: {
                    "created_at": string,"founder_id": string,"id": string,"investor_id": string,"message": string,"startup_id": string | null,"status": Database["public"]['Enums']["request_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"founder_id": string,"id"?: string,"investor_id": string,"message": string,"startup_id"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"founder_id"?: string,"id"?: string,"investor_id"?: string,"message"?: string,"startup_id"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "investor_introductions_founder_id_fkey"
      columns: ["founder_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "investor_introductions_founder_id_fkey"
      columns: ["founder_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "investor_introductions_founder_id_fkey"
      columns: ["founder_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "investor_introductions_investor_id_fkey"
      columns: ["investor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "investor_introductions_investor_id_fkey"
      columns: ["investor_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "investor_introductions_investor_id_fkey"
      columns: ["investor_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "investor_introductions_startup_id_fkey"
      columns: ["startup_id"]
isOneToOne: false
      referencedRelation: "startups"
      referencedColumns: ["id"]
    }
                  ]
                },"investor_profiles": {
                  Row: {
                    "created_at": string,"geographic_preferences": (string)[],"investment_sectors": (string)[],"investor_category": string,"organisation_name": string | null,"organisation_website": string | null,"preferred_stages": (Database["public"]['Enums']["startup_stage"])[],"professional_background": string,"profile_id": string,"public_portfolio_links": (string)[],"regulatory_disclaimer_accepted": boolean,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"geographic_preferences"?: (string)[],"investment_sectors"?: (string)[],"investor_category": string,"organisation_name"?: string | null,"organisation_website"?: string | null,"preferred_stages"?: (Database["public"]['Enums']["startup_stage"])[],"professional_background": string,"profile_id": string,"public_portfolio_links"?: (string)[],"regulatory_disclaimer_accepted"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"geographic_preferences"?: (string)[],"investment_sectors"?: (string)[],"investor_category"?: string,"organisation_name"?: string | null,"organisation_website"?: string | null,"preferred_stages"?: (Database["public"]['Enums']["startup_stage"])[],"professional_background"?: string,"profile_id"?: string,"public_portfolio_links"?: (string)[],"regulatory_disclaimer_accepted"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "investor_profiles_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "investor_profiles_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "investor_profiles_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"launch_votes": {
                  Row: {
                    "created_at": string,"launch_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"launch_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"launch_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "launch_votes_launch_id_fkey"
      columns: ["launch_id"]
isOneToOne: false
      referencedRelation: "product_launches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "launch_votes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "launch_votes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "launch_votes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"membership_applications": {
                  Row: {
                    "applicant_details": NonNullable<Json>,"applicant_type": Database["public"]['Enums']["applicant_type"],"check_followers": boolean,"check_posts": boolean,"check_relationship": boolean,"check_website": boolean,"company_description": string | null,"company_linkedin": string | null,"company_name": string | null,"company_website": string | null,"founded_year": number | null,"founder_role": string | null,"id": string,"industry": string | null,"info_request": string | null,"internal_admin_notes": string | null,"linkedin_follower_count": number | null,"normalized_domain": string | null,"normalized_linkedin": string | null,"organisation_name": string | null,"organisation_website": string | null,"profile_id": string,"rejection_reason": string | null,"relationship_to_company": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"sample_post_urls": (string)[],"stage": Database["public"]['Enums']["startup_stage"] | null,"status": Database["public"]['Enums']["verification_status"],"submitted_at": string,"team_size": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "applicant_details"?: NonNullable<Json>,"applicant_type"?: Database["public"]['Enums']["applicant_type"],"check_followers"?: boolean,"check_posts"?: boolean,"check_relationship"?: boolean,"check_website"?: boolean,"company_description"?: string | null,"company_linkedin"?: string | null,"company_name"?: string | null,"company_website"?: string | null,"founded_year"?: number | null,"founder_role"?: string | null,"id"?: string,"industry"?: string | null,"info_request"?: string | null,"internal_admin_notes"?: string | null,"linkedin_follower_count"?: number | null,"normalized_domain"?: string | null,"normalized_linkedin"?: string | null,"organisation_name"?: string | null,"organisation_website"?: string | null,"profile_id": string,"rejection_reason"?: string | null,"relationship_to_company"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"sample_post_urls"?: (string)[],"stage"?: Database["public"]['Enums']["startup_stage"] | null,"status"?: Database["public"]['Enums']["verification_status"],"submitted_at"?: string,"team_size"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "applicant_details"?: NonNullable<Json>,"applicant_type"?: Database["public"]['Enums']["applicant_type"],"check_followers"?: boolean,"check_posts"?: boolean,"check_relationship"?: boolean,"check_website"?: boolean,"company_description"?: string | null,"company_linkedin"?: string | null,"company_name"?: string | null,"company_website"?: string | null,"founded_year"?: number | null,"founder_role"?: string | null,"id"?: string,"industry"?: string | null,"info_request"?: string | null,"internal_admin_notes"?: string | null,"linkedin_follower_count"?: number | null,"normalized_domain"?: string | null,"normalized_linkedin"?: string | null,"organisation_name"?: string | null,"organisation_website"?: string | null,"profile_id"?: string,"rejection_reason"?: string | null,"relationship_to_company"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"sample_post_urls"?: (string)[],"stage"?: Database["public"]['Enums']["startup_stage"] | null,"status"?: Database["public"]['Enums']["verification_status"],"submitted_at"?: string,"team_size"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "membership_applications_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "membership_applications_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "content": string,"conversation_id": string,"created_at": string,"id": string,"is_read": boolean,"sender_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content": string,"conversation_id": string,"created_at"?: string,"id"?: string,"is_read"?: boolean,"sender_id": string
                  }
                  Update: {
                    "content"?: string,"conversation_id"?: string,"created_at"?: string,"id"?: string,"is_read"?: boolean,"sender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"created_at": string,"id": string,"is_read": boolean,"link": string | null,"title": string,"type": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"is_read"?: boolean,"link"?: string | null,"title": string,"type": string,"user_id": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"is_read"?: boolean,"link"?: string | null,"title"?: string,"type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"opportunities": {
                  Row: {
                    "category": string,"created_at": string,"created_by": string,"description": string,"expires_at": string | null,"id": string,"is_demo": boolean,"location": string | null,"reviewed_by": string | null,"source_url": string,"starts_at": string | null,"status": Database["public"]['Enums']["opportunity_status"],"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"created_at"?: string,"created_by": string,"description": string,"expires_at"?: string | null,"id"?: string,"is_demo"?: boolean,"location"?: string | null,"reviewed_by"?: string | null,"source_url": string,"starts_at"?: string | null,"status"?: Database["public"]['Enums']["opportunity_status"],"title": string
                  }
                  Update: {
                    "category"?: string,"created_at"?: string,"created_by"?: string,"description"?: string,"expires_at"?: string | null,"id"?: string,"is_demo"?: boolean,"location"?: string | null,"reviewed_by"?: string | null,"source_url"?: string,"starts_at"?: string | null,"status"?: Database["public"]['Enums']["opportunity_status"],"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "opportunities_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "opportunities_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"platform_settings": {
                  Row: {
                    "key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "key": string,"updated_at"?: string,"updated_by"?: string | null,"value": NonNullable<Json>
                  }
                  Update: {
                    "key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "platform_settings_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "platform_settings_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "platform_settings_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"post_comments": {
                  Row: {
                    "author_id": string,"content": string,"created_at": string,"id": string,"parent_id": string | null,"post_id": string,"status": Database["public"]['Enums']["content_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"content": string,"created_at"?: string,"id"?: string,"parent_id"?: string | null,"post_id": string,"status"?: Database["public"]['Enums']["content_status"]
                  }
                  Update: {
                    "author_id"?: string,"content"?: string,"created_at"?: string,"id"?: string,"parent_id"?: string | null,"post_id"?: string,"status"?: Database["public"]['Enums']["content_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "post_comments_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "post_comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"post_reactions": {
                  Row: {
                    "created_at": string,"post_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"post_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"post_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_reactions_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_reactions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_reactions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_reactions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "author_id": string,"category": Database["public"]['Enums']["post_category"],"comments_count": number,"content": string,"created_at": string,"external_link": string | null,"id": string,"is_demo": boolean,"media_urls": (string)[],"reactions_count": number,"startup_id": string | null,"status": Database["public"]['Enums']["content_status"],"title": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"category": Database["public"]['Enums']["post_category"],"comments_count"?: number,"content": string,"created_at"?: string,"external_link"?: string | null,"id"?: string,"is_demo"?: boolean,"media_urls"?: (string)[],"reactions_count"?: number,"startup_id"?: string | null,"status"?: Database["public"]['Enums']["content_status"],"title"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string,"category"?: Database["public"]['Enums']["post_category"],"comments_count"?: number,"content"?: string,"created_at"?: string,"external_link"?: string | null,"id"?: string,"is_demo"?: boolean,"media_urls"?: (string)[],"reactions_count"?: number,"startup_id"?: string | null,"status"?: Database["public"]['Enums']["content_status"],"title"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "posts_startup_id_fkey"
      columns: ["startup_id"]
isOneToOne: false
      referencedRelation: "startups"
      referencedColumns: ["id"]
    }
                  ]
                },"product_feedback": {
                  Row: {
                    "author_id": string,"content": string,"created_at": string,"id": string,"launch_id": string,"status": Database["public"]['Enums']["content_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"content": string,"created_at"?: string,"id"?: string,"launch_id": string,"status"?: Database["public"]['Enums']["content_status"]
                  }
                  Update: {
                    "author_id"?: string,"content"?: string,"created_at"?: string,"id"?: string,"launch_id"?: string,"status"?: Database["public"]['Enums']["content_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_feedback_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_feedback_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_feedback_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "product_feedback_launch_id_fkey"
      columns: ["launch_id"]
isOneToOne: false
      referencedRelation: "product_launches"
      referencedColumns: ["id"]
    }
                  ]
                },"product_launches": {
                  Row: {
                    "category": string,"created_at": string,"description": string,"feedback_requested": string | null,"founder_id": string,"id": string,"is_demo": boolean,"is_featured": boolean,"launch_date": string,"logo_url": string | null,"name": string,"normalized_domain": string,"screenshots": (string)[],"slug": string,"stage": Database["public"]['Enums']["startup_stage"],"startup_id": string,"status": Database["public"]['Enums']["content_status"],"tagline": string,"updated_at": string,"votes_count": number,"website_url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"created_at"?: string,"description": string,"feedback_requested"?: string | null,"founder_id": string,"id"?: string,"is_demo"?: boolean,"is_featured"?: boolean,"launch_date"?: string,"logo_url"?: string | null,"name": string,"normalized_domain"?: string,"screenshots"?: (string)[],"slug": string,"stage": Database["public"]['Enums']["startup_stage"],"startup_id": string,"status"?: Database["public"]['Enums']["content_status"],"tagline": string,"updated_at"?: string,"votes_count"?: number,"website_url": string
                  }
                  Update: {
                    "category"?: string,"created_at"?: string,"description"?: string,"feedback_requested"?: string | null,"founder_id"?: string,"id"?: string,"is_demo"?: boolean,"is_featured"?: boolean,"launch_date"?: string,"logo_url"?: string | null,"name"?: string,"normalized_domain"?: string,"screenshots"?: (string)[],"slug"?: string,"stage"?: Database["public"]['Enums']["startup_stage"],"startup_id"?: string,"status"?: Database["public"]['Enums']["content_status"],"tagline"?: string,"updated_at"?: string,"votes_count"?: number,"website_url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_launches_founder_id_fkey"
      columns: ["founder_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_launches_founder_id_fkey"
      columns: ["founder_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_launches_founder_id_fkey"
      columns: ["founder_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "product_launches_startup_id_fkey"
      columns: ["startup_id"]
isOneToOne: false
      referencedRelation: "startups"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "areas_of_expertise": (string)[],"avatar_url": string | null,"bio": string | null,"created_at": string,"email": string,"full_name": string,"headline": string | null,"hidden_fields": (string)[],"id": string,"is_demo": boolean,"linkedin_url": string | null,"location": string | null,"role": Database["public"]['Enums']["user_role"],"skills": (string)[],"suspended_at": string | null,"updated_at": string,"verification_status": Database["public"]['Enums']["verification_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "areas_of_expertise"?: (string)[],"avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"email": string,"full_name"?: string,"headline"?: string | null,"hidden_fields"?: (string)[],"id": string,"is_demo"?: boolean,"linkedin_url"?: string | null,"location"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"skills"?: (string)[],"suspended_at"?: string | null,"updated_at"?: string,"verification_status"?: Database["public"]['Enums']["verification_status"]
                  }
                  Update: {
                    "areas_of_expertise"?: (string)[],"avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"email"?: string,"full_name"?: string,"headline"?: string | null,"hidden_fields"?: (string)[],"id"?: string,"is_demo"?: boolean,"linkedin_url"?: string | null,"location"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"skills"?: (string)[],"suspended_at"?: string | null,"updated_at"?: string,"verification_status"?: Database["public"]['Enums']["verification_status"]
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"id": string,"reason": string,"reporter_id": string,"resolution_note": string | null,"resolved_at": string | null,"resolved_by": string | null,"status": Database["public"]['Enums']["report_status"],"target_id": string,"target_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"reason": string,"reporter_id": string,"resolution_note"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"],"target_id": string,"target_type": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"reason"?: string,"reporter_id"?: string,"resolution_note"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"],"target_id"?: string,"target_type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "reports_resolved_by_fkey"
      columns: ["resolved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_resolved_by_fkey"
      columns: ["resolved_by"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_resolved_by_fkey"
      columns: ["resolved_by"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"saved_items": {
                  Row: {
                    "created_at": string,"item_id": string,"item_type": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"item_id": string,"item_type": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"item_id"?: string,"item_type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saved_items_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "saved_items_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "saved_items_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"startup_claims": {
                  Row: {
                    "claimant_id": string,"created_at": string,"id": string,"message": string,"reviewed_at": string | null,"reviewed_by": string | null,"startup_id": string,"status": Database["public"]['Enums']["request_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "claimant_id": string,"created_at"?: string,"id"?: string,"message": string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"startup_id": string,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Update: {
                    "claimant_id"?: string,"created_at"?: string,"id"?: string,"message"?: string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"startup_id"?: string,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "startup_claims_claimant_id_fkey"
      columns: ["claimant_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "startup_claims_claimant_id_fkey"
      columns: ["claimant_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "startup_claims_claimant_id_fkey"
      columns: ["claimant_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "startup_claims_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "startup_claims_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "startup_claims_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "startup_claims_startup_id_fkey"
      columns: ["startup_id"]
isOneToOne: false
      referencedRelation: "startups"
      referencedColumns: ["id"]
    }
                  ]
                },"startup_members": {
                  Row: {
                    "id": string,"is_admin": boolean,"joined_at": string,"profile_id": string,"role_title": string,"startup_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"is_admin"?: boolean,"joined_at"?: string,"profile_id": string,"role_title"?: string,"startup_id": string
                  }
                  Update: {
                    "id"?: string,"is_admin"?: boolean,"joined_at"?: string,"profile_id"?: string,"role_title"?: string,"startup_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "startup_members_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "startup_members_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "startup_members_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    },{
      foreignKeyName: "startup_members_startup_id_fkey"
      columns: ["startup_id"]
isOneToOne: false
      referencedRelation: "startups"
      referencedColumns: ["id"]
    }
                  ]
                },"startups": {
                  Row: {
                    "created_at": string,"created_by": string | null,"founded_year": number,"id": string,"industry": string,"is_demo": boolean,"is_verified": boolean,"linkedin_url": string,"location": string | null,"logo_url": string | null,"name": string,"normalized_domain": string,"normalized_linkedin": string,"problem_statement": string | null,"product_overview": string | null,"screenshots": (string)[],"short_description": string,"slug": string,"stage": Database["public"]['Enums']["startup_stage"],"team_size": number,"updated_at": string,"verified_at": string | null,"website_url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"founded_year": number,"id"?: string,"industry": string,"is_demo"?: boolean,"is_verified"?: boolean,"linkedin_url": string,"location"?: string | null,"logo_url"?: string | null,"name": string,"normalized_domain": string,"normalized_linkedin": string,"problem_statement"?: string | null,"product_overview"?: string | null,"screenshots"?: (string)[],"short_description": string,"slug": string,"stage"?: Database["public"]['Enums']["startup_stage"],"team_size"?: number,"updated_at"?: string,"verified_at"?: string | null,"website_url": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"founded_year"?: number,"id"?: string,"industry"?: string,"is_demo"?: boolean,"is_verified"?: boolean,"linkedin_url"?: string,"location"?: string | null,"logo_url"?: string | null,"name"?: string,"normalized_domain"?: string,"normalized_linkedin"?: string,"problem_statement"?: string | null,"product_overview"?: string | null,"screenshots"?: (string)[],"short_description"?: string,"slug"?: string,"stage"?: Database["public"]['Enums']["startup_stage"],"team_size"?: number,"updated_at"?: string,"verified_at"?: string | null,"website_url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "startups_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "startups_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "startups_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                },"verification_evidence": {
                  Row: {
                    "application_id": string,"created_at": string,"id": string,"kind": string,"storage_path": string,"uploaded_by": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"created_at"?: string,"id"?: string,"kind"?: string,"storage_path": string,"uploaded_by": string
                  }
                  Update: {
                    "application_id"?: string,"created_at"?: string,"id"?: string,"kind"?: string,"storage_path"?: string,"uploaded_by"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "verification_evidence_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "membership_applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "verification_evidence_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "verification_evidence_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "public_founders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "verification_evidence_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "public_startup_team"
      referencedColumns: ["profile_id"]
    }
                  ]
                }
          }
          Views: {
            "public_founders": {
                  Row: {
                    "areas_of_expertise": (string)[] | null,"avatar_url": string | null,"bio": string | null,"created_at": string | null,"full_name": string | null,"headline": string | null,"id": string | null,"is_demo": boolean | null,"linkedin_url": string | null,"location": string | null,"skills": (string)[] | null
                  }
                  ComputedFields: never
                  Insert: {
                           "areas_of_expertise"?: (string)[] | null,"avatar_url"?: never,"bio"?: never,"created_at"?: string | null,"full_name"?: string | null,"headline"?: string | null,"id"?: string | null,"is_demo"?: boolean | null,"linkedin_url"?: never,"location"?: never,"skills"?: never
                         }
                        Update: {
                           "areas_of_expertise"?: (string)[] | null,"avatar_url"?: never,"bio"?: never,"created_at"?: string | null,"full_name"?: string | null,"headline"?: string | null,"id"?: string | null,"is_demo"?: boolean | null,"linkedin_url"?: never,"location"?: never,"skills"?: never
                         }
                        Relationships: [
                    
                  ]
                },"public_startup_team": {
                  Row: {
                    "avatar_url": string | null,"full_name": string | null,"headline": string | null,"is_admin": boolean | null,"profile_id": string | null,"role_title": string | null,"startup_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "startup_members_startup_id_fkey"
      columns: ["startup_id"]
isOneToOne: false
      referencedRelation: "startups"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "admin_overview":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_profile_emails":
{ Args: { "p_ids": (string)[] }; Returns: {
              "email": string,"id": string
            }[]
                           },
"admin_set_user_status":
{ Args: { "p_action": string,"p_reason"?: string,"p_user": string }; Returns: undefined
                           },
"archive_expired_opportunities":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"audit":
{ Args: { "p_action": string,"p_details": Json,"p_table": string,"p_target": string }; Returns: undefined
                           },
"block_user":
{ Args: { "p_user": string }; Returns: undefined
                           },
"can_message":
{ Args: { "p_conv": string }; Returns: boolean
                           },
"check_company":
{ Args: { "p_linkedin"?: string,"p_website": string }; Returns: Json
                           },
"claim_startup":
{ Args: { "p_message": string,"p_startup": string }; Returns: string
                           },
"create_startup":
{ Args: { "p": Json }; Returns: string
                           },
"ensure_conversation":
{ Args: { "a": string,"b": string }; Returns: string
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_approved_as":
{ Args: { "p_role": Database["public"]['Enums']["user_role"],"p_user": string }; Returns: boolean
                           },
"is_approved_founder":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_approved_investor":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_blocked_between":
{ Args: { "a": string,"b": string }; Returns: boolean
                           },
"is_conversation_participant":
{ Args: { "p_conv": string }; Returns: boolean
                           },
"is_member":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_startup_admin":
{ Args: { "p_startup": string }; Returns: boolean
                           },
"is_startup_member":
{ Args: { "p_startup": string }; Returns: boolean
                           },
"is_super_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"manage_interview":
{ Args: { "p_action": string,"p_app": string,"p_meeting_link"?: string,"p_notes"?: string,"p_recommendation"?: string,"p_scheduled_at"?: string }; Returns: undefined
                           },
"mark_conversation_read":
{ Args: { "p_conv": string }; Returns: undefined
                           },
"moderate_report":
{ Args: { "p_action": string,"p_note"?: string,"p_report": string }; Returns: undefined
                           },
"normalize_domain":
{ Args: { "input": string }; Returns: string
                           },
"normalize_linkedin":
{ Args: { "input": string }; Returns: string
                           },
"notify":
{ Args: { "p_body": string,"p_link": string,"p_title": string,"p_type": string,"p_user": string }; Returns: undefined
                           },
"public_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"request_connection":
{ Args: { "p_recipient": string }; Returns: string
                           },
"request_introduction":
{ Args: { "p_founder": string,"p_message": string,"p_startup": string }; Returns: string
                           },
"resolve_claim":
{ Args: { "p_approve": boolean,"p_claim": string }; Returns: undefined
                           },
"respond_connection":
{ Args: { "p_accept": boolean,"p_id": string }; Returns: undefined
                           },
"respond_design_partner":
{ Args: { "p_accept": boolean,"p_id": string }; Returns: undefined
                           },
"respond_introduction":
{ Args: { "p_accept": boolean,"p_id": string }; Returns: undefined
                           },
"respond_to_info_request":
{ Args: { "p": Json,"p_app": string }; Returns: undefined
                           },
"review_application":
{ Args: { "p_app": string,"p_checks"?: Json,"p_decision": string,"p_notes"?: string,"p_reason"?: string }; Returns: undefined
                           },
"review_opportunity":
{ Args: { "p_approve": boolean,"p_id": string }; Returns: undefined
                           },
"slugify":
{ Args: { "input": string }; Returns: string
                           },
"submit_application":
{ Args: { "p": Json }; Returns: string
                           },
"verify_startup":
{ Args: { "p_startup": string,"p_verify": boolean }; Returns: undefined
                           }
          }
          Enums: {
            "applicant_type": "founder"|"investor"|"partner","connection_status": "pending"|"accepted"|"declined"|"blocked","content_status": "published"|"removed","opportunity_status": "pending"|"approved"|"rejected"|"archived","post_category": "building_in_public"|"product_update"|"startup_milestone"|"ask_community"|"looking_for_feedback"|"seeking_design_partners"|"collaboration_request"|"lessons_learned"|"product_launch","report_status": "open"|"dismissed"|"actioned","request_status": "pending"|"accepted"|"declined"|"withdrawn","startup_stage": "idea"|"prototype"|"mvp"|"early_revenue"|"scaling","user_role": "public_visitor"|"founder"|"investor"|"ecosystem_partner"|"moderator"|"super_admin","verification_status": "unverified"|"submitted"|"under_review"|"info_required"|"interview_pending"|"interview_completed"|"approved"|"rejected"|"suspended"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "applicant_type": ["founder", "investor", "partner"],"connection_status": ["pending", "accepted", "declined", "blocked"],"content_status": ["published", "removed"],"opportunity_status": ["pending", "approved", "rejected", "archived"],"post_category": ["building_in_public", "product_update", "startup_milestone", "ask_community", "looking_for_feedback", "seeking_design_partners", "collaboration_request", "lessons_learned", "product_launch"],"report_status": ["open", "dismissed", "actioned"],"request_status": ["pending", "accepted", "declined", "withdrawn"],"startup_stage": ["idea", "prototype", "mvp", "early_revenue", "scaling"],"user_role": ["public_visitor", "founder", "investor", "ecosystem_partner", "moderator", "super_admin"],"verification_status": ["unverified", "submitted", "under_review", "info_required", "interview_pending", "interview_completed", "approved", "rejected", "suspended"]
          }
        }
} as const
