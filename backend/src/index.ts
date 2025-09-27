import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Upload endpoint - uploads data to Supabase database
app.post("/upload", async (req, res) => {
  try {
    const { table, data } = req.body;

    // Validate request body
    if (!table || !data) {
      return res.status(400).json({
        error: "Missing required fields: table and data",
      });
    }

    // Insert data into specified table
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(400).json({
        error: "Database operation failed",
        details: error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Data uploaded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get data endpoint - retrieves data from Supabase database
app.get("/data/:table", async (req, res) => {
  try {
    const { table } = req.params;
    const {
      limit = 10,
      offset = 0,
      orderBy = "created_at",
      order = "desc",
      ...filters
    } = req.query;

    // Validate table parameter
    if (!table) {
      return res.status(400).json({
        error: "Table name is required",
      });
    }

    // Build query
    let query = supabase.from(table).select("*");

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (
        value &&
        key !== "limit" &&
        key !== "offset" &&
        key !== "orderBy" &&
        key !== "order"
      ) {
        query = query.eq(key, value);
      }
    });

    // Apply ordering and pagination
    query = query
      .order(orderBy as string, { ascending: order === "asc" })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return res.status(400).json({
        error: "Database operation failed",
        details: error.message,
      });
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: count,
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/upload`);
  console.log(`📥 Get data endpoint: http://localhost:${PORT}/data/:table`);
});

export default app;
