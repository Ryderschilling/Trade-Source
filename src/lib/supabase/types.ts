export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      category_groups: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      quote_requests: {
        Row: {
          id: string;
          group_id: string | null;
          category_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          description: string;
          timeline: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id?: string | null;
          category_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          description: string;
          timeline?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string | null;
          category_id?: string | null;
          name?: string;
          email?: string;
          phone?: string | null;
          description?: string;
          timeline?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quote_requests_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "category_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_requests_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      quote_request_recipients: {
        Row: {
          id: string;
          quote_request_id: string;
          contractor_id: string;
          notified_at: string;
          viewed_at: string | null;
        };
        Insert: {
          id?: string;
          quote_request_id: string;
          contractor_id: string;
          notified_at?: string;
          viewed_at?: string | null;
        };
        Update: {
          id?: string;
          quote_request_id?: string;
          contractor_id?: string;
          notified_at?: string;
          viewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "quote_request_recipients_quote_request_id_fkey";
            columns: ["quote_request_id"];
            isOneToOne: false;
            referencedRelation: "quote_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_request_recipients_contractor_id_fkey";
            columns: ["contractor_id"];
            isOneToOne: false;
            referencedRelation: "contractors";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "homeowner" | "contractor" | "admin";
          phone: string | null;
          city: string | null;
          bio: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "homeowner" | "contractor" | "admin";
          phone?: string | null;
          city?: string | null;
          bio?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "homeowner" | "contractor" | "admin";
          phone?: string | null;
          city?: string | null;
          bio?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contractors: {
        Row: {
          id: string;
          user_id: string | null;
          slug: string;
          business_name: string;
          owner_name: string | null;
          tagline: string | null;
          description: string | null;
          category_id: string;
          phone: string | null;
          email: string | null;
          website: string | null;
          address: string | null;
          city: string;
          state: string;
          zip: string | null;
          service_areas: string[];
          logo_url: string | null;
          cover_url: string | null;
          license_number: string | null;
          is_insured: boolean;
          is_licensed: boolean;
          years_in_business: number | null;
          years_experience: number | null;
          status: "pending" | "active" | "suspended";
          is_claimed: boolean;
          is_featured: boolean;
          avg_rating: number | null;
          review_count: number;
          additional_categories: string[];
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          slug: string;
          business_name: string;
          owner_name?: string | null;
          tagline?: string | null;
          description?: string | null;
          category_id: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          address?: string | null;
          city?: string;
          state?: string;
          zip?: string | null;
          service_areas?: string[];
          logo_url?: string | null;
          cover_url?: string | null;
          license_number?: string | null;
          is_insured?: boolean;
          is_licensed?: boolean;
          years_in_business?: number | null;
          years_experience?: number | null;
          additional_categories?: string[];
          status?: "pending" | "active" | "suspended";
          is_claimed?: boolean;
          is_featured?: boolean;
          avg_rating?: number | null;
          review_count?: number;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          slug?: string;
          business_name?: string;
          owner_name?: string | null;
          tagline?: string | null;
          description?: string | null;
          category_id?: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          address?: string | null;
          city?: string;
          state?: string;
          zip?: string | null;
          service_areas?: string[];
          logo_url?: string | null;
          cover_url?: string | null;
          license_number?: string | null;
          is_insured?: boolean;
          is_licensed?: boolean;
          years_in_business?: number | null;
          years_experience?: number | null;
          additional_categories?: string[];
          status?: "pending" | "active" | "suspended";
          is_claimed?: boolean;
          is_featured?: boolean;
          avg_rating?: number | null;
          review_count?: number;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contractors_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contractors_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          description: string | null;
          sort_order: number;
          group_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          description?: string | null;
          sort_order?: number;
          group_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string | null;
          description?: string | null;
          sort_order?: number;
          group_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "category_groups";
            referencedColumns: ["id"];
          }
        ];
      };
      reviews: {
        Row: {
          id: string;
          contractor_id: string;
          user_id: string;
          rating: number;
          title: string | null;
          body: string | null;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contractor_id: string;
          user_id: string;
          rating: number;
          title?: string | null;
          body?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contractor_id?: string;
          user_id?: string;
          rating?: number;
          title?: string | null;
          body?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_contractor_id_fkey";
            columns: ["contractor_id"];
            isOneToOne: false;
            referencedRelation: "contractors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      leads: {
        Row: {
          id: string;
          contractor_id: string;
          name: string;
          email: string;
          phone: string | null;
          message: string;
          service_type: string | null;
          preferred_contact: "email" | "phone" | "either";
          status: "new" | "viewed" | "contacted" | "closed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contractor_id: string;
          name: string;
          email: string;
          phone?: string | null;
          message: string;
          service_type?: string | null;
          preferred_contact?: "email" | "phone" | "either";
          status?: "new" | "viewed" | "contacted" | "closed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contractor_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          message?: string;
          service_type?: string | null;
          preferred_contact?: "email" | "phone" | "either";
          status?: "new" | "viewed" | "contacted" | "closed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_contractor_id_fkey";
            columns: ["contractor_id"];
            isOneToOne: false;
            referencedRelation: "contractors";
            referencedColumns: ["id"];
          }
        ];
      };
      leaderboard_snapshots: {
        Row: {
          id: string;
          snapshot_date: string;
          category: "most_viewed" | "top_rated" | "most_reviewed";
          rank: number;
          contractor_id: string;
          metric_value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          snapshot_date?: string;
          category: "most_viewed" | "top_rated" | "most_reviewed";
          rank: number;
          contractor_id: string;
          metric_value: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          snapshot_date?: string;
          category?: "most_viewed" | "top_rated" | "most_reviewed";
          rank?: number;
          contractor_id?: string;
          metric_value?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leaderboard_snapshots_contractor_id_fkey";
            columns: ["contractor_id"];
            isOneToOne: false;
            referencedRelation: "contractors";
            referencedColumns: ["id"];
          }
        ];
      };
      user_follows: {
        Row: {
          follower_id: string;
          following_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      portfolio_photos: {
        Row: {
          id: string;
          contractor_id: string;
          url: string;
          caption: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          contractor_id: string;
          url: string;
          caption?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          contractor_id?: string;
          url?: string;
          caption?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "portfolio_photos_contractor_id_fkey";
            columns: ["contractor_id"];
            isOneToOne: false;
            referencedRelation: "contractors";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_view_count: {
        Args: { p_contractor_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Contractor = Database["public"]["Tables"]["contractors"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type PortfolioPhoto = Database["public"]["Tables"]["portfolio_photos"]["Row"];
export type UserFollow = Database["public"]["Tables"]["user_follows"]["Row"];
export type LeaderboardSnapshot = Database["public"]["Tables"]["leaderboard_snapshots"]["Row"];

// Contractor with joined data
export type ContractorWithCategory = Contractor & {
  categories: Category;
};

export type ContractorWithReviews = Contractor & {
  categories: Category;
  reviews: Review[];
  portfolio_photos: PortfolioPhoto[];
};

export type CategoryGroup = Database["public"]["Tables"]["category_groups"]["Row"];
export type QuoteRequest = Database["public"]["Tables"]["quote_requests"]["Row"];
export type QuoteRequestRecipient = Database["public"]["Tables"]["quote_request_recipients"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
