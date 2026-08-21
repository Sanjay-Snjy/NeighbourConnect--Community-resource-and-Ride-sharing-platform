import { z } from "zod";
import { RIDE_TYPES } from "@/utils/constants";

const rideTypeValues = RIDE_TYPES.map((t) => t.value);

export const rideSchema = z.object({
  ride_type: z.enum(rideTypeValues, { message: "Offer or request a ride?" }),
  origin: z.string().trim().min(2, "Where does it start?").max(160),
  destination: z.string().trim().min(2, "Where is it headed?").max(160),
  date: z.string().min(1, "Choose a date"),
  time: z.string().min(1, "Add a time"),
  seats: z.coerce
    .number({ message: "How many seats?" })
    .int()
    .min(1, "At least 1 seat")
    .max(8, "Up to 8 seats"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const rideRequestSchema = z.object({
  seats: z.coerce.number().int().min(1, "At least 1 seat").max(8),
  message: z.string().trim().max(300).optional().or(z.literal("")),
});
