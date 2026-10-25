package com.hackathon.training.domain.service;

import com.hackathon.training.domain.model.Category;
import com.hackathon.training.persience.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CategoryMatcherService {

    private final CategoryRepository categoryRepo;
    private final List<Category> cache = new ArrayList<>();
    private boolean loaded = false;

    public CategoryMatcherService(CategoryRepository categoryRepo) {
        this.categoryRepo = categoryRepo;
    }

    public synchronized void refreshCache() {
        cache.clear();
        cache.addAll(categoryRepo.findAll());
        loaded = true;
    }

    private void ensureLoaded() {
        if (!loaded) refreshCache();
    }

    public Category match(String purpose) {
        if (purpose == null) return null;
        ensureLoaded();
        String lower = purpose.toLowerCase();
        Category best = null;
        int bestScore = 0;

        for (Category c : cache) {
            String name = c.getName().toLowerCase();
            int score = 0;
            if (lower.contains(name)) {
                score = name.length() * 10;
            } else {
                for (String kw : keywordsFor(name)) {
                    if (lower.contains(kw)) score += kw.length() * 5;
                }
            }
            if (score > bestScore) {
                bestScore = score;
                best = c;
            }
        }
        return bestScore > 0 ? best : null;
    }

    public Category fallback(String direction) {
        ensureLoaded();
        String target = "INCOME".equals(direction) ? "Выручка" : "Прочее";
        for (Category c : cache) {
            if (c.getName().equalsIgnoreCase(target)) return c;
        }
        return null;
    }

    private List<String> keywordsFor(String categoryName) {
        return switch (categoryName) {
            case "зарплата" -> List.of("зарплат", "оплата труда", "аванс сотрудник", "выплата сотрудник");
            case "аренда" -> List.of("аренд", "наем помещен", "помещение");
            case "налоги" -> List.of("налог", "усн", "енп", "ндс", "ндфл", "взнос", "фнс", "казн", "бюджет");
            case "выручка" -> List.of("оплата по счет", "за товар", "за услуг", "поступлен", "выручк", "эквайринг", "сбп", "зачислен");
            case "закупки" -> List.of("закупк", "поставщ", "товар", "материал");
            case "банковские услуги" -> List.of("комисси", "банк", "обслуживан", "эквайринг", "мерчант");
            default -> List.of();
        };
    }
}