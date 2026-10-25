package com.hackathon.training.web.controller;

import com.hackathon.training.domain.model.Category;
import com.hackathon.training.domain.model.Transaction;
import com.hackathon.training.domain.service.CategoryMatcherService;
import com.hackathon.training.domain.service.CsvParserService;
import com.hackathon.training.persience.repository.CategoryRepository;
import com.hackathon.training.persience.repository.TransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionRepository repo;
    private final CsvParserService csvParserService;
    private final CategoryRepository categoryRepo;
    private final CategoryMatcherService matcher;

    public TransactionController(TransactionRepository repo,
                                 CsvParserService csvParserService,
                                 CategoryRepository categoryRepo,
                                 CategoryMatcherService matcher) {
        this.repo = repo;
        this.csvParserService = csvParserService;
        this.categoryRepo = categoryRepo;
        this.matcher = matcher;
    }

    @GetMapping
    public Map<String, Object> getTransactions(
            @RequestParam Long userId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        LocalDate from = dateFrom != null ? LocalDate.parse(dateFrom) : null;
        PageRequest pr = PageRequest.of(page, size);

        Page<Transaction> pg;
        if (from != null && categoryId != null) {
            pg = repo.findByUserAndDateAndCategory(userId, from, categoryId, pr);
        } else if (from != null) {
            pg = repo.findByUserAndDate(userId, from, pr);
        } else if (categoryId != null) {
            pg = repo.findByUserAndCategory(userId, categoryId, pr);
        } else {
            pg = repo.findByUserOnly(userId, pr);
        }

        List<Map<String, Object>> content = new ArrayList<>();
        for (Transaction t : pg.getContent()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", t.getId());
            m.put("operationDate", t.getOperationDate() != null ? t.getOperationDate().toString() : null);
            m.put("amount", t.getAmount());
            m.put("direction", t.getDirection());
            m.put("counterpartyName", t.getCounterpartyName());
            m.put("counterpartyInn", t.getCounterpartyInn());
            m.put("paymentPurpose", t.getPaymentPurpose());
            m.put("balanceEod", t.getBalanceEod());
            m.put("isManual", t.getIsManual());
            m.put("categoryId", t.getCategory() != null ? t.getCategory().getId() : null);
            m.put("categoryName", t.getCategory() != null ? t.getCategory().getName() : null);
            content.add(m);
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("content", content);
        res.put("totalElements", pg.getTotalElements());
        res.put("totalPages", pg.getTotalPages());
        res.put("number", pg.getNumber());
        res.put("size", pg.getSize());
        return res;
    }

    @PostMapping("/upload")
    public Map<String, Object> uploadCsv(@RequestParam("file") MultipartFile file, @RequestParam Long userId) {
        try {
            File tempFile = File.createTempFile("upload_", ".csv");
            file.transferTo(tempFile);
            long start = System.currentTimeMillis();
            int count = csvParserService.parseAndSaveCsv(tempFile.getAbsolutePath(), userId);
            long elapsed = System.currentTimeMillis() - start;
            tempFile.delete();

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("importedCount", count);
            res.put("elapsedMs", elapsed);
            res.put("message", "Успешно загружено " + count + " операций за " + elapsed + " мс");
            return res;
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    @PatchMapping("/{id}/category")
    public Map<String, Object> updateCategory(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        Transaction tx = repo.findById(id).orElseThrow(() -> new RuntimeException("Транзакция не найдена"));
        tx.setCategory(categoryRepo.findById(body.get("categoryId")).orElse(null));
        repo.save(tx);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", tx.getId());
        m.put("categoryId", tx.getCategory() != null ? tx.getCategory().getId() : null);
        m.put("categoryName", tx.getCategory() != null ? tx.getCategory().getName() : null);
        return m;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Транзакция не найдена");
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/recategorize")
    public Map<String, Object> recategorize(@RequestParam Long userId) {
        List<Transaction> txs = repo.findByUserIdOrderByOperationDateDesc(userId);
        int changed = 0;
        for (Transaction t : txs) {
            Category matched = matcher.match(t.getPaymentPurpose(), t.getDirection());
            if (matched == null) matched = matcher.fallback(t.getDirection());
            if (matched != null && (t.getCategory() == null || !t.getCategory().getId().equals(matched.getId()))) {
                t.setCategory(matched);
                changed++;
            }
        }
        repo.saveAll(txs);
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("updated", changed);
        res.put("total", txs.size());
        return res;
    }
}