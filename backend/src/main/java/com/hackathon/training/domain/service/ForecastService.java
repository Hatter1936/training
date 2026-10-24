package com.hackathon.training.domain.service;

import com.hackathon.training.domain.model.*;
import com.hackathon.training.persience.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
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
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(30);

        List<Transaction> recentTransactions = transactionRepo.findByUserIdAndOperationDateAfter(userId, thirtyDaysAgo);

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        int daysWithData = 30;

        for (Transaction t : recentTransactions) {
            if ("INCOME".equals(t.getDirection())) {
                totalIncome = totalIncome.add(t.getAmount());
            } else {
                totalExpense = totalExpense.add(t.getAmount().abs());
            }
        }

        BigDecimal avgDailyIncome = totalIncome.divide(BigDecimal.valueOf(daysWithData), 2, RoundingMode.HALF_UP);
        BigDecimal avgDailyExpense = totalExpense.divide(BigDecimal.valueOf(daysWithData), 2, RoundingMode.HALF_UP);

        BigDecimal currentBalance = transactionRepo.findFirstByUserIdOrderByOperationDateDesc(userId)
                .map(Transaction::getBalanceEod)
                .orElse(BigDecimal.ZERO);

        List<Event> pendingEvents = eventRepo.findByUserIdAndIsPaidFalse(userId);
        Map<LocalDate, List<Event>> eventsByDate = pendingEvents.stream()
                .collect(Collectors.groupingBy(Event::getEventDate));

        List<Map<String, Object>> forecastList = new ArrayList<>();
        List<Map<String, Object>> warnings = new ArrayList<>();
        BigDecimal balance = currentBalance;

        for (int i = 1; i <= 30; i++) {
            LocalDate targetDate = today.plusDays(i);
            balance = balance.add(avgDailyIncome).subtract(avgDailyExpense);

            List<Event> dayEvents = eventsByDate.getOrDefault(targetDate, Collections.emptyList());
            for (Event event : dayEvents) {
                if ("INCOME".equals(event.getType())) {
                    balance = balance.add(event.getAmount());
                } else {
                    balance = balance.subtract(event.getAmount());
                }
            }

            Map<String, Object> day = new HashMap<>();
            day.put("date", targetDate.toString());
            day.put("balance", balance);

            boolean isGap = balance.compareTo(BigDecimal.ZERO) < 0;
            day.put("isGap", isGap);
            forecastList.add(day);

            if (isGap) {
                Map<String, Object> warning = new HashMap<>();
                warning.put("date", targetDate.toString());
                warning.put("shortage", balance.abs());
                warning.put("reason", "Ожидаемые расходы превышают поступления");
                warnings.add(warning);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("currentBalance", currentBalance);
        result.put("forecast", forecastList);
        result.put("warnings", warnings);
        return result;
    }
}
