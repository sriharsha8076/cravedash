package com.cravedash.model;

import java.util.List;

/**
 * Represents a restaurant with its menu.
 * Stored as a static seed — no Redis persistence needed for the menu data.
 */
public class Restaurant {

    private String id;
    private String name;
    private String cuisine;
    private String description;
    private String emoji;
    private int deliveryTime; // minutes
    private double rating;
    private List<MenuItem> menu;

    public Restaurant() {}

    public Restaurant(String id, String name, String cuisine, String description,
                      String emoji, int deliveryTime, double rating, List<MenuItem> menu) {
        this.id = id;
        this.name = name;
        this.cuisine = cuisine;
        this.description = description;
        this.emoji = emoji;
        this.deliveryTime = deliveryTime;
        this.rating = rating;
        this.menu = menu;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCuisine() { return cuisine; }
    public void setCuisine(String cuisine) { this.cuisine = cuisine; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }

    public int getDeliveryTime() { return deliveryTime; }
    public void setDeliveryTime(int deliveryTime) { this.deliveryTime = deliveryTime; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public List<MenuItem> getMenu() { return menu; }
    public void setMenu(List<MenuItem> menu) { this.menu = menu; }

    /** Nested MenuItem class */
    public static class MenuItem {
        private String id;
        private String name;
        private int price;
        private String description;
        private String emoji;

        public MenuItem() {}

        public MenuItem(String id, String name, int price, String description, String emoji) {
            this.id = id;
            this.name = name;
            this.price = price;
            this.description = description;
            this.emoji = emoji;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public int getPrice() { return price; }
        public void setPrice(int price) { this.price = price; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getEmoji() { return emoji; }
        public void setEmoji(String emoji) { this.emoji = emoji; }
    }
}
