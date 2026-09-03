import { handleStatsRequest } from "../_github.js";

export default function handler(req, res) {
  return handleStatsRequest(req, res, true);
}
