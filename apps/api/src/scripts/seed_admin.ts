import { db } from "../config/db.js";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  try {
    const adminEmail = "admin@fairwayfund.com";
    const adminPassword = "Admin@123";
    
    // Check if user exists
    const res = await db.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
    
    if (res.rows.length === 0) {
      console.log("Admin user not found. Creating...");
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(adminPassword, salt);
      
      await db.query(
        "INSERT INTO users (id, email, password_hash, role, is_active) VALUES (gen_random_uuid(), $1, $2, 'ADMIN', true)",
        [adminEmail, hash]
      );
      console.log("Admin user created successfully.");
    } else {
      console.log("Admin user exists. Updating password to ensure it is correct...");
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(adminPassword, salt);
      
      await db.query(
        "UPDATE users SET password_hash = $1, role = 'ADMIN', is_active = true WHERE email = $2",
        [hash, adminEmail]
      );
      console.log("Admin user updated successfully.");
    }
  } catch (err) {
    console.error("Failed to seed admin:", err);
  } finally {
    db.end();
  }
}

seedAdmin();
