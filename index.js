import express from "express";
import mysql from "mysql";
import ErrorHandler from "./middleware/ErrorHandler.js";
import ErrorClass from "./utils/ErrorClass.js";
import geolib from "geolib";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

//DB connection
const DB = mysql.createConnection({
  host: "localhost",
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});
DB.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Database connected succesfully");
  }
});

// server connection
app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});

//Ṛoutes
//post routes
app.post("/addSchool", async (req, res, next) => {
  try {
    // throw new Error("test error");
    const { id, name, address, latitude, longitude } = req.body;
    await DB.query(
      "INSERT INTO school VALUES (?,?,?,?,?)",
      [id, name, address, latitude, longitude],
      (err, result) => {
        if (err) {
          return next(new ErrorClass(err.message, 400));
        } else {
          console.log("inserted Successfully");
          return res.status(201).json({
            code: 201,
            status: true,
            message: "School registered successfully",
          });
        }
      }
    );
  } catch (error) {
    return next(new ErrorClass(error.message, 400));
  }
});

//get route
app.get("/listSchools", async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    if (!latitude || !longitude) {
      return next(new ErrorClass("Latitude and Longitude are required", 400));
    }

    const query = "SELECT * FROM school";

    DB.query(query, (err, results) => {
      if (err) {
        return next(
          new ErrorClass("Error fetching data from the database", 400)
        );
      }

      const sortedSchools = results
        .map((school) => {
          const distanceMeter = geolib.getDistance(
            { latitude: userLat, longitude: userLng },
            {
              latitude: parseFloat(school.latitude),
              longitude: parseFloat(school.longitude),
            }
          );
          const distanceKM = distanceMeter / 1000;
          return { ...school, distanceKM };
        })
        .sort((a, b) => a.distanceKM - b.distanceKM);
      res.json(sortedSchools);
    });
  } catch (error) {
    return next(new ErrorClass(error.message, 400));
  }
});

//not found api
app.use("*", (req, res) => {
  res.status(404).json({
    code: 404,
    status: false,
    message: "API not found",
  });
});

//middleware
app.use(ErrorHandler);
