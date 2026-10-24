package com.hackathon.training.web.controller;

import com.hackathon.training.domain.model.Transaction;
import com.hackathon.training.domain.service.CsvParserService;
import com.hackathon.training.persience.repository.TransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionRepository repo;
    private final CsvParserService csvParserService;

    public TransactionController(TransactionRepository repo, CsvParserService csvParserService) {
        this.repo = repo;
        this.csvParserService = csvParserService;
    }

    @GetMapping
    public Page<Transaction> getTransactions(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        return repo.findByUserIdOrderByOperationDateDesc(userId, PageRequest.of(page, size));
    }

    @PostMapping("/upload")
    public String uploadCsv(@RequestParam Long userId, @RequestParam String filePath) {
        csvParserService.parseAndSaveCsv(filePath, userId);
        return "Файл загружен!";
    }
}
