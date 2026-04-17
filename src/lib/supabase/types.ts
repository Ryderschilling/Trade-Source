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
          status: "pending" | "active" | "suspended";
          is_claimed: boolean;
          is_featured: boolean;
          avg_rating: number | null;
          review_count: number;
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
          status?: "pending" | "active" | "suspended";
          is_claimed?: boolean;
          is_featured?: boolean;
          avg_rating?: number | null;
          review_count?: number;
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
          status?: "pending" | "active" | "suspended";
          is_claimed?: boolean;
          is_featured?: boolean;
          avg_rating?: number | null;
          review_count?: number;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
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
    Functions: Record<string, never>;
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

// Contractor with joined data
export type ContractorWithCategory = Contractor & {
  categories: Category;
};

export type ContractorWithReviews = Contractor & {
  categories: Category;
  reviews: Review[];
  portfolio_photos: PortfolioPhoto[];
};
