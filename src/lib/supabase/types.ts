export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor: string
          created_at: string
          diff: Json | null
          id: number
          ip: string | null
          target_id: string | null
          target_table: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor: string
          created_at?: string
          diff?: Json | null
          id?: number
          ip?: string | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor?: string
          created_at?: string
          diff?: Json | null
          id?: number
          ip?: string | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      business_addons: {
        Row: {
          addon_type: string
          business_id: string
          cancelled_at: string | null
          id: string
          notes: string | null
          reserved_month: string | null
          started_at: string
          status: string
          stripe_subscription_item_id: string | null
        }
        Insert: {
          addon_type: string
          business_id: string
          cancelled_at?: string | null
          id?: string
          notes?: string | null
          reserved_month?: string | null
          started_at?: string
          status?: string
          stripe_subscription_item_id?: string | null
        }
        Update: {
          addon_type?: string
          business_id?: string
          cancelled_at?: string | null
          id?: string
          notes?: string | null
          reserved_month?: string | null
          started_at?: string
          status?: string
          stripe_subscription_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_addons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          category_group: string
          created_at: string
          description: string | null
          group_id: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          category_group?: string
          created_at?: string
          description?: string | null
          group_id?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          category_group?: string
          created_at?: string
          description?: string | null
          group_id?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "category_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      category_groups: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          body: string
          created_at: string
          email: string
          id: string
          ip: string | null
          name: string
          phone: string | null
          status: string
          subject: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          body: string
          created_at?: string
          email: string
          id?: string
          ip?: string | null
          name: string
          phone?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          email?: string
          id?: string
          ip?: string | null
          name?: string
          phone?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      contractor_packages: {
        Row: {
          contractor_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          price_label: string | null
          sort_order: number
        }
        Insert: {
          contractor_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price_label?: string | null
          sort_order?: number
        }
        Update: {
          contractor_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price_label?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "contractor_packages_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_services: {
        Row: {
          contractor_id: string
          created_at: string
          description: string | null
          duration_label: string | null
          id: string
          is_active: boolean
          name: string
          price: number | null
          price_type: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          description?: string | null
          duration_label?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          price_type?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          description?: string | null
          duration_label?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          price_type?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_services_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_webhook_settings: {
        Row: {
          contractor_id: string
          created_at: string
          id: string
          notify_email: string | null
          updated_at: string
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string
          id?: string
          notify_email?: string | null
          updated_at?: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string
          id?: string
          notify_email?: string | null
          updated_at?: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_webhook_settings_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: true
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          additional_categories: string[]
          address: string | null
          avg_rating: number | null
          billing_plan: string
          billing_status: string
          business_name: string
          category_id: string
          city: string
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_claimed: boolean
          is_featured: boolean
          is_insured: boolean
          is_licensed: boolean
          lat: number | null
          license_number: string | null
          listing_status: string
          lng: number | null
          logo_url: string | null
          next_billing_date: string | null
          owner_name: string | null
          payment_last4: string | null
          phone: string | null
          review_count: number
          service_areas: string[]
          slug: string
          state: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          tagline: string | null
          updated_at: string
          user_id: string | null
          view_count: number
          website: string | null
          years_experience: number | null
          years_in_business: number | null
          zip: string | null
        }
        Insert: {
          additional_categories?: string[]
          address?: string | null
          avg_rating?: number | null
          billing_plan?: string
          billing_status?: string
          business_name: string
          category_id: string
          city?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_claimed?: boolean
          is_featured?: boolean
          is_insured?: boolean
          is_licensed?: boolean
          lat?: number | null
          license_number?: string | null
          listing_status?: string
          lng?: number | null
          logo_url?: string | null
          next_billing_date?: string | null
          owner_name?: string | null
          payment_last4?: string | null
          phone?: string | null
          review_count?: number
          service_areas?: string[]
          slug: string
          state?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          tagline?: string | null
          updated_at?: string
          user_id?: string | null
          view_count?: number
          website?: string | null
          years_experience?: number | null
          years_in_business?: number | null
          zip?: string | null
        }
        Update: {
          additional_categories?: string[]
          address?: string | null
          avg_rating?: number | null
          billing_plan?: string
          billing_status?: string
          business_name?: string
          category_id?: string
          city?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_claimed?: boolean
          is_featured?: boolean
          is_insured?: boolean
          is_licensed?: boolean
          lat?: number | null
          license_number?: string | null
          listing_status?: string
          lng?: number | null
          logo_url?: string | null
          next_billing_date?: string | null
          owner_name?: string | null
          payment_last4?: string | null
          phone?: string | null
          review_count?: number
          service_areas?: string[]
          slug?: string
          state?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          tagline?: string | null
          updated_at?: string
          user_id?: string | null
          view_count?: number
          website?: string | null
          years_experience?: number | null
          years_in_business?: number | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractors_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          quote_request_id: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          quote_request_id?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          quote_request_id?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          body_markdown: string
          created_at: string
          created_by: string | null
          delivered_count: number | null
          failed_count: number | null
          id: string
          list_id: string
          recipient_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          body_markdown: string
          created_at?: string
          created_by?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          list_id: string
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          body_markdown?: string
          created_at?: string
          created_by?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          list_id?: string
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "email_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      email_list_members: {
        Row: {
          added_at: string
          email: string
          list_id: string
          unsubscribed_at: string | null
          user_id: string | null
        }
        Insert: {
          added_at?: string
          email: string
          list_id: string
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Update: {
          added_at?: string
          email?: string
          list_id?: string
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "email_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_list_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_lists: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          query_args: Json | null
          query_kind: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          query_args?: Json | null
          query_kind?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          query_args?: Json | null
          query_kind?: string | null
        }
        Relationships: []
      }
      email_sends: {
        Row: {
          campaign_id: string | null
          created_at: string
          error: string | null
          id: string
          kind: string
          meta: Json | null
          resend_id: string | null
          status: string
          to_email: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          meta?: Json | null
          resend_id?: string | null
          status?: string
          to_email: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          meta?: Json | null
          resend_id?: string | null
          status?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_unsubscribes: {
        Row: {
          created_at: string
          email: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          email: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          reason?: string | null
        }
        Relationships: []
      }
      featured_placements: {
        Row: {
          contractor_id: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          slot: string
          sort_order: number
          starts_at: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          slot?: string
          sort_order?: number
          starts_at?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          slot?: string
          sort_order?: number
          starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_placements_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_snapshots: {
        Row: {
          category: string
          contractor_id: string
          created_at: string | null
          id: string
          metric_value: number
          rank: number
          snapshot_date: string
        }
        Insert: {
          category: string
          contractor_id: string
          created_at?: string | null
          id?: string
          metric_value: number
          rank: number
          snapshot_date?: string
        }
        Update: {
          category?: string
          contractor_id?: string
          created_at?: string | null
          id?: string
          metric_value?: number
          rank?: number
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_snapshots_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          contractor_id: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          notes: string | null
          package_name: string | null
          phone: string | null
          preferred_contact: string
          preferred_date: string | null
          service_address: string | null
          service_id: string | null
          service_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contractor_id: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          notes?: string | null
          package_name?: string | null
          phone?: string | null
          preferred_contact?: string
          preferred_date?: string | null
          service_address?: string | null
          service_id?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contractor_id?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          notes?: string | null
          package_name?: string | null
          phone?: string | null
          preferred_contact?: string
          preferred_date?: string | null
          service_address?: string | null
          service_id?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "contractor_services"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string | null
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_photos: {
        Row: {
          caption: string | null
          contractor_id: string
          created_at: string
          id: string
          sort_order: number
          url: string
        }
        Insert: {
          caption?: string | null
          contractor_id: string
          created_at?: string
          id?: string
          sort_order?: number
          url: string
        }
        Update: {
          caption?: string | null
          contractor_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_photos_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_public: boolean
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_public?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_public?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_request_recipients: {
        Row: {
          contractor_id: string
          id: string
          notified_at: string
          quote_request_id: string
          viewed_at: string | null
        }
        Insert: {
          contractor_id: string
          id?: string
          notified_at?: string
          quote_request_id: string
          viewed_at?: string | null
        }
        Update: {
          contractor_id?: string
          id?: string
          notified_at?: string
          quote_request_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_request_recipients_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_request_recipients_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          category_id: string | null
          created_at: string
          description: string
          email: string
          followup_sent_at: string | null
          group_id: string | null
          id: string
          name: string
          phone: string | null
          timeline: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description: string
          email: string
          followup_sent_at?: string | null
          group_id?: string | null
          id?: string
          name: string
          phone?: string | null
          timeline?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string
          email?: string
          followup_sent_at?: string | null
          group_id?: string | null
          id?: string
          name?: string
          phone?: string | null
          timeline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "category_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          contractor_id: string
          created_at: string
          id: string
          is_anonymous: boolean
          is_verified: boolean
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          contractor_id: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_verified?: boolean
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          contractor_id?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_verified?: boolean
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          created_at: string
          id: string
          payload: Json
          processed_at: string | null
          processing_error: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id: string
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          type?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_view_count: {
        Args: { p_contractor_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Convenience row types
export type Profile = Tables<'profiles'>
export type Contractor = Tables<'contractors'>
export type Category = Tables<'categories'>
export type ContractorPackage = Tables<'contractor_packages'>
export type PortfolioPhoto = Tables<'portfolio_photos'>
export type Lead = Tables<'leads'>
export type BusinessAddon = Tables<'business_addons'>
export type ContractorWithCategory = Contractor & {
  categories: { id: string; name: string; slug: string } | null
}
