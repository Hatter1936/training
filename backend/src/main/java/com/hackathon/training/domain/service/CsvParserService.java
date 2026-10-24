package com.hackathon.training.domain.service;

import com.hackathon.training.domain.model.Category;
import com.hackathon.training.domain.model.Transaction;
import com.hackathon.training.domain.model.User;
import com.hackathon.training.persience.repository.CategoryRepository;
import com.hackathon.training.persience.repository.TransactionRepository;
import com.hackathon.training.persience.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@Service
public class CsvParserService {
    private final TransactionRepository transactionRepo;
    private final UserRepository userRepo;
    private final CategoryRepository categoryRepo;

    public CsvParserService(TransactionRepository transactionRepo, UserRepository userRepo, CategoryRepository categoryRepo) {
        this.transactionRepo = transactionRepo;
        this.userRepo = userRepo;
        this.categoryRepo = categoryRepo;
    }

    public void parseAndSaveCsv(String filePath, Long userId) {
        User user = userRepo.findById(userId).orElseThrow();
        List<Category> categories = categoryRepo.findAll();
        int count = 0;

        List<Transaction> batchList = new java.util.ArrayList<>();
        int BATCH_SIZE = 1000;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(filePath), java.nio.charset.StandardCharsets.UTF_8))) {
            String line;
            boolean isFirstLine = true;

            while ((line = br.readLine()) != null) {
                if (line.startsWith("\uFEFF")) line = line.substring(1); // Убираем BOM
                if (isFirstLine) { isFirstLine = false; continue; }
                if (line.trim().isEmpty()) continue;

                String[] parts = line.split(";");
                if (parts.length < 9) continue;

                try {
                    Transaction tx = new Transaction();
                    tx.setOperationDate(LocalDate.parse(parts[2].trim()));
                    tx.setAmount(new BigDecimal(parts[3].trim().replace(",", ".")));
                    tx.setDirection(parts[4].trim().equals("Поступление") ? "INCOME" : "EXPENSE");
                    tx.setCounterpartyInn(parts[5].trim());
                    tx.setCounterpartyName(parts[6].trim());
                    tx.setPaymentPurpose(parts[7].trim());
                    tx.setBalanceEod(new BigDecimal(parts[8].trim().replace(",", ".")));
                    tx.setUser(user);

                    String purpose = parts[7].toLowerCase();
                    Category matchedCategory = categories.stream()
                            .filter(c -> purpose.contains(c.getName().toLowerCase()))
                            .findFirst()
                            .orElse(null);
                    tx.setCategory(matchedCategory);

                    batchList.add(tx);
                    count++;

                    if (batchList.size() >= BATCH_SIZE) {
                        transactionRepo.saveAll(batchList);
                        batchList.clear();
                        System.out.println("Загружено: " + count);
                    }
                } catch (Exception e) {
                }
            }

            if (!batchList.isEmpty()) {
                transactionRepo.saveAll(batchList);
            }

            System.out.println("Успешно загружено: " + count);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}