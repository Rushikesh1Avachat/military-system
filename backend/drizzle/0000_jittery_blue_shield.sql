CREATE TABLE IF NOT EXISTS "assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"base_id" integer NOT NULL,
	"equipment_type_id" integer NOT NULL,
	"asset_name" text NOT NULL,
	"assigned_to" text NOT NULL,
	"quantity" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" text NOT NULL,
	"action" text NOT NULL,
	"actor_role" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bases" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"commander" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bases_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "equipment_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "equipment_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenditures" (
	"id" serial PRIMARY KEY NOT NULL,
	"base_id" integer NOT NULL,
	"equipment_type_id" integer NOT NULL,
	"asset_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"expenditure_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"base_id" integer NOT NULL,
	"equipment_type_id" integer NOT NULL,
	"opening_balance" integer DEFAULT 0 NOT NULL,
	"closing_balance" integer DEFAULT 0 NOT NULL,
	"quantity_on_hand" integer DEFAULT 0 NOT NULL,
	"assigned_quantity" integer DEFAULT 0 NOT NULL,
	"expended_quantity" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"base_id" integer NOT NULL,
	"equipment_type_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(10, 2) DEFAULT '0',
	"purchase_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_base_id" integer NOT NULL,
	"to_base_id" integer NOT NULL,
	"equipment_type_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"transfer_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"role" text NOT NULL,
	"assigned_base_id" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
