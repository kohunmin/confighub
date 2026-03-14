import { redirect } from "next/navigation";

export default function Home() {
  redirect("/tool/claude?section=mcp");
}
