package com.cravedash.controller;

import com.cravedash.model.Restaurant;
import com.cravedash.model.Restaurant.MenuItem;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * GET /api/restaurants — returns a static curated list of restaurants with menus.
 * No Redis needed here — this is seed/catalogue data, not transactional.
 */
@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private static final List<Restaurant> RESTAURANTS = List.of(
        new Restaurant("biryani-house", "Biryani House", "Indian",
            "Authentic Hyderabadi dum biryani, slow-cooked to perfection",
            "🍛", 35, 4.7,
            List.of(
                new MenuItem("bh-1", "Chicken Biryani",      349, "Aromatic basmati with tender chicken",         "🍗"),
                new MenuItem("bh-2", "Mutton Biryani",       449, "Slow-cooked mutton in rich spices",            "🐑"),
                new MenuItem("bh-3", "Veg Biryani",          249, "Garden-fresh veggies in dum style",            "🥦"),
                new MenuItem("bh-4", "Raita",                 49, "Chilled yogurt with cucumber & mint",          "🥛"),
                new MenuItem("bh-5", "Gulab Jamun (2 pcs)",  89, "Soft dumplings in rose syrup",                 "🍩")
            )
        ),
        new Restaurant("pizza-paradiso", "Pizza Paradiso", "Italian",
            "Wood-fired Neapolitan pizzas with the finest imported ingredients",
            "🍕", 30, 4.5,
            List.of(
                new MenuItem("pp-1", "Margherita",           299, "Classic tomato, mozzarella, fresh basil",     "🍅"),
                new MenuItem("pp-2", "Pepperoni Blast",      399, "Double pepperoni with smoked gouda",          "🌶️"),
                new MenuItem("pp-3", "BBQ Chicken",          429, "Smoky BBQ sauce, grilled chicken, onion",     "🍗"),
                new MenuItem("pp-4", "Truffle Mushroom",     449, "Truffle oil, wild mushrooms, parmesan",       "🍄"),
                new MenuItem("pp-5", "Choco Lava",           179, "Warm molten chocolate cake",                  "🍫")
            )
        ),
        new Restaurant("sushi-station", "Sushi Station", "Japanese",
            "Premium fresh sushi & sashimi delivered in eco-friendly packaging",
            "🍱", 40, 4.8,
            List.of(
                new MenuItem("ss-1", "Salmon Nigiri (6 pcs)",  499, "Fresh Atlantic salmon on seasoned rice",    "🐟"),
                new MenuItem("ss-2", "Dragon Roll",            549, "Shrimp tempura, avocado, eel sauce",        "🥑"),
                new MenuItem("ss-3", "Tuna Sashimi (8 pcs)",  599, "Premium bluefin tuna, thinly sliced",       "🔪"),
                new MenuItem("ss-4", "Edamame",                99, "Lightly salted steamed soybeans",            "🌿"),
                new MenuItem("ss-5", "Miso Soup",             119, "Traditional white miso with tofu & wakame", "🍵")
            )
        ),
        new Restaurant("burger-barn", "Burger Barn", "American",
            "Smash burgers made fresh, every single order, never frozen",
            "🍔", 25, 4.3,
            List.of(
                new MenuItem("bb-1", "Classic Smash",          199, "Double smash patty, American cheese, pickles",    "🧀"),
                new MenuItem("bb-2", "Spicy Jalapeño Burger",  229, "Smash patty, jalapeños, sriracha mayo",           "🌶️"),
                new MenuItem("bb-3", "Crispy Chicken Burger",  219, "Southern fried chicken, coleslaw, honey mustard", "🍗"),
                new MenuItem("bb-4", "Loaded Fries",           149, "Fries, cheese sauce, jalapeños, sour cream",      "🍟"),
                new MenuItem("bb-5", "Oreo Shake",             179, "Thick Oreo milkshake with whipped cream",         "🥤")
            )
        ),
        new Restaurant("tandoor-tales", "Tandoor Tales", "North Indian",
            "Royal Mughlai cuisine — kebabs, curries & freshly baked bread",
            "🫓", 45, 4.6,
            List.of(
                new MenuItem("tt-1", "Butter Chicken",         369, "Creamy tomato gravy with tender chicken",      "🍛"),
                new MenuItem("tt-2", "Dal Makhani",            279, "Black lentils slow-cooked overnight",          "🫘"),
                new MenuItem("tt-3", "Seekh Kebab (4 pcs)",   329, "Minced lamb kebabs with green chutney",        "🍢"),
                new MenuItem("tt-4", "Garlic Naan",             69, "Tandoor-baked bread with garlic butter",       "🫓"),
                new MenuItem("tt-5", "Phirni",                 129, "Rose-flavoured rice pudding in clay pot",      "🍮")
            )
        ),
        new Restaurant("wok-wonder", "Wok Wonder", "Chinese",
            "Street-style Chinese — hakka noodles, dim sum & more",
            "🥢", 28, 4.2,
            List.of(
                new MenuItem("ww-1", "Chicken Hakka Noodles",   199, "Wok-tossed noodles, veggies, soy sauce",    "🍜"),
                new MenuItem("ww-2", "Dim Sum Basket (6 pcs)", 249, "Steamed pork & shrimp dumplings",             "🥟"),
                new MenuItem("ww-3", "Kung Pao Chicken",       279, "Stir-fry with peanuts, chillies & veggies",  "🥜"),
                new MenuItem("ww-4", "Fried Rice",             179, "Egg or veg fried rice in wok",               "🍚"),
                new MenuItem("ww-5", "Honey Chilli Potato",    159, "Crispy potato fingers in honey chilli glaze", "🍯")
            )
        )
    );

    /** GET /api/restaurants — full catalogue with menus */
    @GetMapping
    public List<Restaurant> list() {
        return RESTAURANTS;
    }

    /** GET /api/restaurants/{id} — single restaurant */
    @GetMapping("/{id}")
    public Restaurant get(@PathVariable String id) {
        return RESTAURANTS.stream()
                .filter(r -> r.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Restaurant not found: " + id));
    }
}
