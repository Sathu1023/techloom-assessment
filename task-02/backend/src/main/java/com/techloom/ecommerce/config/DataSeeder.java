package com.techloom.ecommerce.config;

import com.techloom.ecommerce.entity.Product;
import com.techloom.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Ensures the storefront always has a full catalog: 3 books in every category,
 * each with a cover image. Existing rows are updated (image/category) so a
 * previous partial seed is repaired on restart without wiping stock or orders.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;

    private record SeedBook(
            String name,
            String description,
            String price,
            String category,
            int stock,
            String imageUrl
    ) {}

    @Override
    public void run(String... args) {
        int created = 0;
        int updated = 0;
        for (SeedBook seed : catalog()) {
            Product p = productRepository.findFirstByName(seed.name()).orElseGet(Product::new);
            boolean isNew = p.getId() == null;
            p.setName(seed.name());
            p.setDescription(seed.description());
            p.setPrice(new BigDecimal(seed.price()));
            p.setCategory(seed.category());
            p.setImageUrl(seed.imageUrl());
            if (isNew) {
                p.setTotalStock(seed.stock());
                p.setReservedStock(0);
                created++;
            } else {
                updated++;
            }
            productRepository.save(p);
        }
        System.out.println("BookNest seeder: catalog ready (" + created + " created, "
                + updated + " updated, " + productRepository.count() + " total products).");
    }

    private static List<SeedBook> catalog() {
        return List.of(
                // Fiction
                book("The Midnight Library",
                        "A novel about the lives we could have lived and the choices that define us.",
                        "13.50", "Fiction", 15, "/covers/the-midnight-library.svg"),
                book("Project Hail Mary",
                        "A lone astronaut, an impossible mission, and an unexpected friendship in space.",
                        "18.99", "Fiction", 9, "/covers/project-hail-mary.svg"),
                book("The Seven Husbands of Evelyn Hugo",
                        "A reclusive Hollywood icon finally tells the truth about her glamorous, scandalous life.",
                        "16.99", "Fiction", 11, "/covers/evelyn-hugo.svg"),

                // Non-Fiction
                book("Atomic Habits",
                        "Tiny changes, remarkable results — a practical guide to building better habits.",
                        "16.99", "Non-Fiction", 12, "/covers/atomic-habits.svg"),
                book("Educated",
                        "A memoir of family, education, and the power of reinventing yourself.",
                        "14.99", "Non-Fiction", 10, "/covers/educated.svg"),
                book("Sapiens",
                        "A brief history of humankind, from hunter-gatherers to the modern world.",
                        "19.99", "Non-Fiction", 8, "/covers/sapiens.svg"),

                // Technology
                book("Clean Code",
                        "A handbook of agile software craftsmanship for writing readable, maintainable code.",
                        "32.50", "Technology", 8, "/covers/clean-code.svg"),
                book("The Pragmatic Programmer",
                        "Timeless tips for becoming a more effective and adaptable software engineer.",
                        "44.00", "Technology", 6, "/covers/pragmatic-programmer.svg"),
                book("Designing Data-Intensive Applications",
                        "The deep guide to reliable, scalable, and maintainable data systems.",
                        "49.99", "Technology", 5, "/covers/ddia.svg"),

                // Children's
                book("Where the Wild Things Are",
                        "A classic picture-book adventure of imagination, mischief, and coming home.",
                        "9.99", "Children's", 20, "/covers/wild-things.svg"),
                book("The Very Hungry Caterpillar",
                        "A beloved story of a tiny caterpillar's transformation into a beautiful butterfly.",
                        "8.99", "Children's", 18, "/covers/hungry-caterpillar.svg"),
                book("Charlotte's Web",
                        "The friendship between a pig named Wilbur and a clever spider named Charlotte.",
                        "10.99", "Children's", 14, "/covers/charlottes-web.svg"),

                // Self-Development
                book("The 7 Habits of Highly Effective People",
                        "A principle-centered approach to personal and professional effectiveness.",
                        "18.50", "Self-Development", 10, "/covers/seven-habits.svg"),
                book("Think and Grow Rich",
                        "Napoleon Hill's classic on desire, persistence, and the psychology of success.",
                        "12.99", "Self-Development", 13, "/covers/think-and-grow-rich.svg"),
                book("The Power of Now",
                        "A guide to spiritual enlightenment through presence and letting go of the mind.",
                        "15.99", "Self-Development", 9, "/covers/power-of-now.svg"),

                // Business
                book("The Lean Startup",
                        "How constant innovation and validated learning build successful new companies.",
                        "21.99", "Business", 7, "/covers/lean-startup.svg"),
                book("Good to Great",
                        "What takes companies from being merely good to truly great — and lasting.",
                        "24.00", "Business", 6, "/covers/good-to-great.svg"),
                book("Start With Why",
                        "Simon Sinek on how great leaders inspire action by starting with purpose.",
                        "17.99", "Business", 10, "/covers/start-with-why.svg")
        );
    }

    private static SeedBook book(String name, String description, String price, String category, int stock, String imageUrl) {
        return new SeedBook(name, description, price, category, stock, imageUrl);
    }
}
