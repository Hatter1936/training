package com.hackathon.training.domain.service;

import com.hackathon.training.domain.model.Event;
import com.hackathon.training.domain.model.Transaction;
import com.hackathon.training.persience.repository.EventRepository;
import com.hackathon.training.persience.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ForecastService {

    private final TransactionRepository transactionRepo;
    private final EventRepository eventRepo;

    public ForecastService(TransactionRepository transactionRepo, EventRepository eventRepo) {
        this.transactionRepo = transactionRepo;
        this.eventRepo = eventRepo;
    }

    public Map<String, Object> getForecast(Long userId) {
        List<Transaction> allTx = transactionRepo.findByUserIdOrderByOperationDateDesc(userId);
        Map<String, Object> result = new HashMap<>();

        if (allTx.isEmpty()) {
            result.put("currentBalance", BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            result.put("forecast", Collections.emptyList());
            result.put("warnings", Collections.emptyList());
            result.put("reliability", "LOW");
            result.put("daysOfHistory", 0);
            result.put("avgDailyIncome", BigDecimal.ZERO);
            result.put("avgDailyExpense", BigDecimal.ZERO);
            return result;
        }

        LocalDate today = LocalDate.now();
        LocalDate lastTxDate = allTx.get(0).getOperationDate();
        LocalDate oldestDate = allTx.get(allTx.size() - 1).getOperationDate();
        long daysOfHistory = Math.max(1, ChronoUnit.DAYS.between(oldestDate, today) + 1);
        String reliability = daysOfHistory < 30 ? "LOW" : (daysOfHistory < 60 ? "MEDIUM" : "HIGH");

        Transaction latestBalanceTx = allTx.stream()
                .filter(t -> t.getBalanceEod() != null)
                .max(Comparator.comparing(Transaction::getOperationDate)
                        .thenComparing(Transaction::getId))
                .orElse(allTx.get(0));

        BigDecimal currentBalance = latestBalanceTx.getBalanceEod() != null
                ? latestBalanceTx.getBalanceEod()
                : BigDecimal.ZERO;

        LocalDate windowStart = lastTxDate.minusDays(29);
        List<Transaction> recent = allTx.stream()
                .filter(t -> !t.getOperationDate().isBefore(windowStart))
                .collect(Collectors.toList());

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        for (Transaction t : recent) {
            if (t.getAmount() == null) continue;
            BigDecimal amt = t.getAmount().abs();
            if ("INCOME".equals(t.getDirection())) totalIncome = totalIncome.add(amt);
            else totalExpense = totalExpense.add(amt);
        }

        long daysInWindow = Math.max(1, Math.min(30,
                ChronoUnit.DAYS.between(recent.isEmpty()
                        ? lastTxDate
                        : recent.get(recent.size() - 1).getOperationDate(), lastTxDate) + 1));

        BigDecimal divisor = BigDecimal.valueOf(daysInWindow);
        BigDecimal avgDailyIncome = totalIncome.divide(divisor, 2, RoundingMode.HALF_UP);
        BigDecimal avgDailyExpense = totalExpense.divide(divisor, 2, RoundingMode.HALF_UP);

        List<Event> pendingEvents = eventRepo.findByUserIdAndIsPaidFalse(userId);
        Map<LocalDate, List<Event>> eventsByDate = pendingEvents.stream()
                .filter(e -> e.getEventDate() != null)
                .collect(Collectors.groupingBy(Event::getEventDate));

        List<Map<String, Object>> forecast = new ArrayList<>();
        List<Map<String, Object>> warnings = new ArrayList<>();
        BigDecimal balance = currentBalance;

        LocalDate baseDate = lastTxDate.isAfter(today) ? lastTxDate : today;

        for (int i = 1; i <= 30; i++) {
            LocalDate target = baseDate.plusDays(i);
            balance = balance.add(avgDailyIncome).subtract(avgDailyExpense);

            for (Event e : eventsByDate.getOrDefault(target, Collections.emptyList())) {
                BigDecimal amt = e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO;
                if ("INCOME".equals(e.getType())) balance = balance.add(amt);
                else balance = balance.subtract(amt.abs());
            }

            BigDecimal fmt = balance.setScale(2, RoundingMode.HALF_UP);
            boolean gap = fmt.compareTo(BigDecimal.ZERO) < 0;

            Map<String, Object> day = new LinkedHashMap<>();
            day.put("date", target.toString());
            day.put("balance", fmt);
            day.put("isGap", gap);
            forecast.add(day);

            if (gap) {
                Map<String, Object> w = new LinkedHashMap<>();
                w.put("date", target.toString());
                w.put("shortage", fmt.abs());
                w.put("probability", "HIGH".equals(reliability) ? "HIGH" : "MEDIUM");
                w.put("reason", "Ожидаемые расходы превышают поступления. История: " + daysOfHistory + " дн.");
                warnings.add(w);
            }
        }

        result.put("currentBalance", currentBalance.setScale(2, RoundingMode.HALF_UP));
        result.put("forecast", forecast);
        result.put("warnings", warnings);
        result.put("reliability", reliability);
        result.put("daysOfHistory", daysOfHistory);
        result.put("avgDailyIncome", avgDailyIncome);
        result.put("avgDailyExpense", avgDailyExpense);
        return result;
    }

    public Map<String, Object> scenario(Long userId, String type, BigDecimal percent) {
        Map<String, Object> base = getForecast(userId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> baseForecast = (List<Map<String, Object>>) base.get("forecast");
        if (baseForecast == null || baseForecast.isEmpty()) return base;

        List<Map<String, Object>> scen = new ArrayList<>();
        for (int i = 0; i < baseForecast.size(); i++) {
            Map<String, Object> day = new LinkedHashMap<>(baseForecast.get(i));
            BigDecimal bal = (BigDecimal) day.get("balance");

            if ("DELAY".equals(type) || "REVENUE_DROP".equals(type)) {
                BigDecimal drop = bal.abs().multiply(percent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                bal = bal.subtract(drop);
            } else if ("EXTRA_EXPENSE".equals(type)) {
                if (i >= 9 && i <= 10) bal = bal.subtract(percent);
            }

            BigDecimal fmt = bal.setScale(2, RoundingMode.HALF_UP);
            day.put("balance", fmt);
            day.put("isGap", fmt.compareTo(BigDecimal.ZERO) < 0);
            scen.add(day);
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("base", baseForecast);
        res.put("scenario", scen);
        res.put("type", type);
        return res;
    }
}