package com.hackathon.training.domain.service;

import com.hackathon.training.domain.model.Category;
import com.hackathon.training.domain.model.Transaction;
import com.hackathon.training.domain.model.User;
import com.hackathon.training.persience.repository.TransactionRepository;
import com.hackathon.training.persience.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class CsvParserService {
    private final TransactionRepository transactionRepo;
    private final UserRepository userRepo;
    private final CategoryMatcherService matcher;

    public CsvParserService(TransactionRepository transactionRepo, UserRepository userRepo, CategoryMatcherService matcher) {
        this.transactionRepo = transactionRepo;
        this.userRepo = userRepo;
        this.matcher = matcher;
    }

    public int parseAndSaveCsv(String filePath, Long userId) {
        User user = userRepo.getReferenceById(userId);
        int count = 0;
        List<Transaction> batchList = new ArrayList<>();
        int BATCH_SIZE = 5000;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(filePath), StandardCharsets.UTF_8), 65536)) {
            String line;
            boolean isFirstLine = true;

            while ((line = br.readLine()) != null) {
                if (line.startsWith("\uFEFF")) line = line.substring(1);
                if (isFirstLine) { isFirstLine = false; continue; }
                if (line.trim().isEmpty()) continue;

                String[] parts = line.split(";");
                if (parts.length < 9) continue;

                try {
                    Transaction tx = new Transaction();
                    tx.setOperationDate(LocalDate.parse(parts[2].trim()));
                    tx.setAmount(new BigDecimal(parts[3].trim().replace(",", ".")));
                    tx.setDirection(parts[4].trim().equalsIgnoreCase("Поступление") ? "INCOME" : "EXPENSE");
                    tx.setCounterpartyInn(parts[5].trim());
                    tx.setCounterpartyName(parts[6].trim());
                    tx.setPaymentPurpose(parts[7].trim());
                    tx.setBalanceEod(new BigDecimal(parts[8].trim().replace(",", ".")));
                    tx.setUser(user);
                    tx.setIsManual(false);

                    Category cat = matcher.match(parts[7]);
                    if (cat == null) cat = matcher.fallback(tx.getDirection());
                    tx.setCategory(cat);

                    batchList.add(tx);
                    count++;

                    if (batchList.size() >= BATCH_SIZE) {
                        transactionRepo.saveAll(batchList);
                        batchList.clear();
                    }
                } catch (Exception ignored) {}
            }

            if (!batchList.isEmpty()) {
                transactionRepo.saveAll(batchList);
            }

            return count;
        } catch (Exception e) {
            throw new RuntimeException("Ошибка парсинга CSV: " + e.getMessage());
        }
    }
}