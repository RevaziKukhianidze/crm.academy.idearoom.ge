import { createClient } from "../../supabase/server";
import Link from "next/link";
import Image from "next/image";

interface OfferedCourse {
  id: number;
  title: string;
  image?: string;
  section_image?: string;
  price?: number;
  old_price?: number;
  discount_percentage?: string;
  created_at: string;
}

interface OtherOffersProps {
  currentOfferId?: number;
  className?: string;
}

export default async function OtherOffers({
  currentOfferId,
  className = "",
}: OtherOffersProps) {
  const supabase = await createClient();

  // Fetch latest 5 offers, excluding current one
  const { data: offers, error } = await supabase
    .from("offered_course")
    .select(
      "id, title, image, section_image, price, old_price, discount_percentage, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(6); // Get 6 to ensure we have 5 after filtering current

  if (error) {
    console.error("Error fetching other offers:", error);
    return null;
  }

  // Filter out current offer and limit to 5
  const filteredOffers =
    offers?.filter((offer) => offer.id !== currentOfferId).slice(0, 5) || [];

  if (filteredOffers.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        სხვა შეთავაზებები
      </h3>
      <div className="grid gap-3">
        {filteredOffers.map((offer) => (
          <Link
            key={offer.id}
            href={`/offers/${offer.id}`}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="relative w-16 h-16 flex-shrink-0">
              <Image
                src={
                  offer.section_image || offer.image || "/placeholder-offer.jpg"
                }
                alt={offer.title}
                fill
                className="object-cover rounded-md"
                sizes="64px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                {offer.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                {offer.price && (
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    ₾{offer.price}
                  </span>
                )}
                {offer.old_price && offer.old_price > (offer.price || 0) && (
                  <span className="text-xs text-gray-500 line-through">
                    ₾{offer.old_price}
                  </span>
                )}
                {offer.discount_percentage && (
                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                    -{offer.discount_percentage}%
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Force dynamic rendering to always get fresh data
export const dynamic = "force-dynamic";
