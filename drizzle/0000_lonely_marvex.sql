CREATE TABLE "attendances" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"check_in" timestamp DEFAULT now(),
	"check_out" timestamp,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "users_absensi" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "users_absensi_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_user_id_users_absensi_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_absensi"("id") ON DELETE no action ON UPDATE no action;