import { fetchAuthenticatedAPI } from "@/lib/api";
import { AdminGroup } from "@/utils/models";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const token = req.cookies.get("adminToken");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groups = await fetchAuthenticatedAPI<AdminGroup[]>("/groups", {
      method: "GET",
    }, {
      populate: {
        orders: {
          populate: {
            items: {
              populate: {
                seat: {
                  populate: "section",
                },
                itemType: true,
              },
            },
            customer: true,
          },
        },
      },
    }, token.value);

    // Filter out groups without orders in the 'ok' or 'admin-new' status

    const filteredGroups = groups.filter((group) => group.attributes.orders?.data.some((order) => order.attributes.status === "ok" || order.attributes.status === "admin-new"));

    return NextResponse.json(filteredGroups, { status: 200 });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
