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

    public Category match(String purpose, String direction) {
        if (purpose == null) return null;
        ensureLoaded();
        String lower = purpose.toLowerCase();
        Category best = null;
        int bestScore = 0;

        for (Category c : cache) {
            if (direction != null && c.getType() != null && !c.getType().equals(direction)) {
                continue;
            }
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
            case "зарплата" -> List.of(
                    "заработн", "оплата труда", "аванс сотрудник",
                    "выплата сотрудник", "реестр №", "реестр  №"
            );
            case "аренда" -> List.of(
                    "аренд", "наем помещен", "арендная плата", "помещени"
            );
            case "налоги" -> List.of(
                    "казначейств", "фнс росси", "единый налоговый",
                    "енп", "усн", "налог на", "налог усн", "авансовый платеж по усн",
                    "ндфл", "страховые взносы", "налог на прибыль",
                    "налог на имущество", "транспортный налог"
            );
            case "выручка" -> List.of(
                    "оплата по счет", "оплата по упд", "оплата по договор",
                    "за товар", "за услуг", "за перевозку", "за транспорт",
                    "частичная оплата", "доплата", "предоплата",
                    "поступлен", "выручк", "эквайринг", "сбп", "qr-код",
                    "зачислен", "мерчант", "торговый дом", "маркетплейс"
            );
            case "закупки" -> List.of(
                    "закупк", "поставщ", "материал", "запчаст", "топлив",
                    "канцтовар", "хозтовар", "лицевого счета", "топливные карты"
            );
            case "банковские услуги" -> List.of(
                    "комисси", "обслуживан", "ведение счета",
                    "расчетно-кассов", "эквайринг комисси"
            );
            case "прочее" -> List.of(
                    "ремонт", "шиномонтаж", "клининг", "уборк",
                    "бухгалтерск", "подписк", "лицензи", "штраф"
            );
            default -> List.of();
        };
    }
}