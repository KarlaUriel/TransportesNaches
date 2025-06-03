package com.naches.model;

import java.util.List;

public class NotaGastoResponse {
    private List<NotaGasto> content;
    private long totalElements;
    private Finanza financialSummary;

    // Constructor
    public NotaGastoResponse(List<NotaGasto> content, long totalElements, Finanza financialSummary) {
        this.content = content;
        this.totalElements = totalElements;
        this.financialSummary = financialSummary;
    }

    // Getters and setters
    public List<NotaGasto> getContent() { return content; }
    public void setContent(List<NotaGasto> content) { this.content = content; }
    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }
    public Finanza getFinancialSummary() { return financialSummary; }
    public void setFinancialSummary(Finanza financialSummary) { this.financialSummary = financialSummary; }
}