import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 8.5,
        color: '#000000',
    },
    borderBox: {
        border: '1pt solid #000000',
        marginBottom: 0,
    },
    headerRow: {
        flexDirection: 'row',
        height: 60,
        borderBottom: '1pt solid #000000',
    },
    logoSection: {
        width: '20%',
        borderRight: '1pt solid #000000',
        padding: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 120,
        height: 40,
        objectFit: 'contain',
    },
    titleSection: {
        width: '60%',
        borderRight: '1pt solid #000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleText: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
    },
    infoSection: {
        width: '20%',
        justifyContent: 'center',
        paddingLeft: 10,
    },
    projectInfoRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
        minHeight: 20,
    },
    infoLabel: {
        fontFamily: 'Helvetica-Bold',
        padding: 4,
    },
    infoValue: {
        flex: 1,
        padding: 4,
    },
    table: {
        flexDirection: 'column',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderBottom: '1pt solid #000000',
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
        minHeight: 25,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
        minHeight: 25,
    },
    // Column Widths optimized for Project Summary (Portrait)
    colSno: { width: '10%', borderRight: '1pt solid #000000', justifyContent: 'center', alignItems: 'center' },
    colTitle: { width: '30%', borderRight: '1pt solid #000000', padding: 5, justifyContent: 'center' },
    colDetails: { width: '60%', padding: 5, justifyContent: 'center' },

    footer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
        fontSize: 8,
    },
});

const formatLongData = (data) => {
    if (!data) return "-";
    return String(data).replace(/[\/,]/g, (match) => `${match} `);
};

const ProjectSummaryPDF = ({ summaryData, project }) => {
    return (
        <Document>
            <Page size="A4" orientation="portrait" style={styles.page}>
                <View style={styles.borderBox}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View style={styles.logoSection}>
                            <Image src="/Mano-Logo.png" style={styles.logo} />
                        </View>
                        <View style={styles.titleSection}>
                            <Text style={styles.titleText}>Project Summary</Text>
                        </View>
                        <View style={styles.infoSection}>
                            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Date: {new Date().toLocaleDateString("en-GB")}</Text>
                        </View>
                    </View>

                    {/* Project Info */}
                    <View style={styles.projectInfoRow}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', borderRight: '1pt solid #000000' }}>
                            <Text style={styles.infoLabel}>Project:</Text>
                            <Text style={styles.infoValue}>{project?.project_name || "-"}</Text>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.infoLabel}>Client:</Text>
                            <Text style={styles.infoValue}>{project?.Employer || "-"}</Text>
                        </View>
                    </View>

                    {/* Table */}
                    <View style={styles.table}>
                        {/* Table Header */}
                        <View style={styles.tableHeaderRow}>
                            <View style={styles.colSno}><Text>Sr No.</Text></View>
                            <View style={styles.colTitle}><Text>Title</Text></View>
                            <View style={styles.colDetails}><Text>Details</Text></View>
                        </View>

                        {/* Table Rows */}
                        {summaryData.map((row, index) => (
                            <View key={row.id || index} style={[styles.tableRow, index === summaryData.length - 1 ? { borderBottom: 0 } : {}]}>
                                <View style={styles.colSno}><Text>{index + 1}</Text></View>
                                <View style={styles.colTitle}><Text style={{ fontFamily: 'Helvetica-Bold' }}>{row.title || "-"}</Text></View>
                                <View style={styles.colDetails}><Text>{formatLongData(row.details || row.description)}</Text></View>
                            </View>
                        ))}
                    </View>
                </View>

                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Page ${pageNumber} of ${totalPages}`
                )} fixed />
            </Page>
        </Document>
    );
};

export default ProjectSummaryPDF;
