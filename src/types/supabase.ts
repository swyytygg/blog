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
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            categories: {
                Row: {
                    created_at: string | null
                    id: string
                    name: string
                    order_index: number | null
                    parent_id: string | null
                    slug: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    name: string
                    order_index?: number | null
                    parent_id?: string | null
                    slug: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    name?: string
                    order_index?: number | null
                    parent_id?: string | null
                    slug?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "categories_parent_id_fkey"
                        columns: ["parent_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                ]
            }
            comments: {
                Row: {
                    author_email: string | null
                    author_name: string
                    content: string
                    created_at: string | null
                    id: string
                    is_approved: boolean | null
                    parent_id: string | null
                    post_id: string
                }
                Insert: {
                    author_email?: string | null
                    author_name: string
                    content: string
                    created_at?: string | null
                    id?: string
                    is_approved?: boolean | null
                    parent_id?: string | null
                    post_id: string
                }
                Update: {
                    author_email?: string | null
                    author_name?: string
                    content?: string
                    created_at?: string | null
                    id?: string
                    is_approved?: boolean | null
                    parent_id?: string | null
                    post_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "comments_parent_id_fkey"
                        columns: ["parent_id"]
                        isOneToOne: false
                        referencedRelation: "comments"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "comments_post_id_fkey"
                        columns: ["post_id"]
                        isOneToOne: false
                        referencedRelation: "posts"
                        referencedColumns: ["id"]
                    },
                ]
            }
            post_tags: {
                Row: {
                    post_id: string
                    tag_id: string
                }
                Insert: {
                    post_id: string
                    tag_id: string
                }
                Update: {
                    post_id?: string
                    tag_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "post_tags_post_id_fkey"
                        columns: ["post_id"]
                        isOneToOne: false
                        referencedRelation: "posts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "post_tags_tag_id_fkey"
                        columns: ["tag_id"]
                        isOneToOne: false
                        referencedRelation: "tags"
                        referencedColumns: ["id"]
                    },
                ]
            }
            posts: {
                Row: {
                    author_id: string | null
                    category_id: string | null
                    content: string
                    created_at: string | null
                    excerpt: string | null
                    id: string
                    slug: string
                    status: string
                    thumbnail_url: string | null
                    title: string
                    updated_at: string | null
                    view_count: number | null
                }
                Insert: {
                    author_id?: string | null
                    category_id?: string | null
                    content: string
                    created_at?: string | null
                    excerpt?: string | null
                    id?: string
                    slug: string
                    status?: string
                    thumbnail_url?: string | null
                    title: string
                    updated_at?: string | null
                    view_count?: number | null
                }
                Update: {
                    author_id?: string | null
                    category_id?: string | null
                    content?: string
                    created_at?: string | null
                    excerpt?: string | null
                    id?: string
                    slug?: string
                    status?: string
                    thumbnail_url?: string | null
                    title?: string
                    updated_at?: string | null
                    view_count?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "posts_author_id_fkey"
                        columns: ["author_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "posts_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    bio: string | null
                    created_at: string | null
                    display_name: string | null
                    id: string
                }
                Insert: {
                    avatar_url?: string | null
                    bio?: string | null
                    created_at?: string | null
                    display_name?: string | null
                    id: string
                }
                Update: {
                    avatar_url?: string | null
                    bio?: string | null
                    created_at?: string | null
                    display_name?: string | null
                    id?: string
                }
                Relationships: []
            }
            site_settings: {
                Row: {
                    created_at: string | null
                    description: string | null
                    key: string
                    updated_at: string | null
                    value: string | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    key: string
                    updated_at?: string | null
                    value?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    key?: string
                    updated_at?: string | null
                    value?: string | null
                }
                Relationships: []
            }
            stats: {
                Row: {
                    date: string
                    id: string
                    page_view_count: number | null
                    referrer: string | null
                    visitor_count: number | null
                }
                Insert: {
                    date: string
                    id?: string
                    page_view_count?: number | null
                    referrer?: string | null
                    visitor_count?: number | null
                }
                Update: {
                    date?: string
                    id?: string
                    page_view_count?: number | null
                    referrer?: string | null
                    visitor_count?: number | null
                }
                Relationships: []
            }
            tags: {
                Row: {
                    created_at: string | null
                    id: string
                    name: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    name: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    name?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
