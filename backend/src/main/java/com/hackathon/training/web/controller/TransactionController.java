package com.hackathon.training.web.controller;

import com.hackathon.training.domain.model.Transaction;
import com.hackathon.training.persience.repository.TransactionRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionRepository repo;

    public TransactionController(TransactionRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Transaction> getTransactions(@RequestParam Long userId) {
        return repo.findByUserIdOrderByOperationDateDesc(userId);
    }
}