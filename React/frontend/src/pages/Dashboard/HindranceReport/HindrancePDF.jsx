import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 8,
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
    // Project Info Rows
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
    // Table Styles
    table: {
        flexDirection: 'column',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderBottom: '1pt solid #000000',
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
        minHeight: 20,
    },
    // Column Widths
    colSno: { width: '3%', borderRight: '1pt solid #000000', justifyContent: 'center', alignItems: 'center' },
    colDesc: { width: '15%', borderRight: '1pt solid #000000', padding: 2, justifyContent: 'center' },
    colDate: { width: '6%', borderRight: '1pt solid #000000', justifyContent: 'center', alignItems: 'center' },
    colDay: { width: '3%', borderRight: '1pt solid #000000', justifyContent: 'center', alignItems: 'center' },
    colDelay: { width: '6%', borderRight: '1pt solid #000000', justifyContent: 'center', alignItems: 'center' },
    colResp: { width: '10%', borderRight: '1pt solid #000000', padding: 2, justifyContent: 'center' },
    colRemarks: { width: '10%', borderRight: '1pt solid #000000', padding: 2, justifyContent: 'center' },
    colRemarksEnd: { width: '10%', padding: 2, justifyContent: 'center' },

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

const formatDateDisplay = (isoString) => {
    if (!isoString) return "";
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    } catch (e) {
        return isoString;
    }
};

const calculateDuration = (start, end) => {
    if (!start || !end) return "";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return isNaN(diffDays) ? "-" : diffDays + 1;
};

const calculateDelay = (planned, actual) => {
    if (!planned || !actual) return 0;
    const plannedDate = new Date(planned);
    const actualDate = new Date(actual);
    const diffTime = actualDate - plannedDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return isNaN(diffDays) ? 0 : diffDays;
}

const HindrancePDF = ({ reports, project }) => {
    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.borderBox}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View style={styles.logoSection}>
                            <Image src="/Mano-Logo.png" style={styles.logo} />
                        </View>
                        <View style={styles.titleSection}>
                            <Text style={styles.titleText}>Hindrance Report</Text>
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

                    {/* Table Header */}
                    <View style={styles.table}>
                        <View style={styles.tableHeaderRow}>
                            <View style={[styles.colSno, { height: 30 }]}><Text>S. No.</Text></View>
                            <View style={[styles.colDesc, { height: 30 }]}><Text>Description of Items</Text></View>
                            <View style={{ width: '15%', borderRight: '1pt solid #000000' }}>
                                <View style={{ height: 15, borderBottom: '1pt solid #000000', justifyContent: 'center' }}><Text>Planned Dates</Text></View>
                                <View style={{ flexDirection: 'row', height: 15 }}>
                                    <View style={{ width: '40%', borderRight: '1pt solid #000000', justifyContent: 'center' }}><Text>Start</Text></View>
                                    <View style={{ width: '40%', borderRight: '1pt solid #000000', justifyContent: 'center' }}><Text>Finish</Text></View>
                                    <View style={{ width: '20%', justifyContent: 'center' }}><Text>Day</Text></View>
                                </View>
                            </View>
                            <View style={{ width: '15%', borderRight: '1pt solid #000000' }}>
                                <View style={{ height: 15, borderBottom: '1pt solid #000000', justifyContent: 'center' }}><Text>Actual Dates</Text></View>
                                <View style={{ flexDirection: 'row', height: 15 }}>
                                    <View style={{ width: '40%', borderRight: '1pt solid #000000', justifyContent: 'center' }}><Text>Start</Text></View>
                                    <View style={{ width: '40%', borderRight: '1pt solid #000000', justifyContent: 'center' }}><Text>Finish</Text></View>
                                    <View style={{ width: '20%', justifyContent: 'center' }}><Text>Day</Text></View>
                                </View>
                            </View>
                            <View style={[styles.colDelay, { height: 30 }]}><Text>Delay to Start</Text></View>
                            <View style={[styles.colResp, { height: 30 }]}><Text>{"Responsible\n(Start)"}</Text></View>
                            <View style={[styles.colRemarks, { height: 30 }]}><Text>{"Remarks\n(Start)"}</Text></View>
                            <View style={[styles.colDelay, { height: 30 }]}><Text>Delay to Finish</Text></View>
                            <View style={[styles.colResp, { height: 30 }]}><Text>{"Responsible\n(Finish)"}</Text></View>
                            <View style={[styles.colRemarksEnd, { height: 30 }]}><Text>{"Remarks\n(End)"}</Text></View>
                        </View>

                        {/* Table Rows */}
                        {reports.map((item, index) => {
                            const pDuration = calculateDuration(item.planned_start_date, item.planned_end_date);
                            const aDuration = calculateDuration(item.actual_start_date, item.actual_end_date);
                            const dStart = calculateDelay(item.planned_start_date, item.actual_start_date);
                            const dFinish = calculateDelay(item.planned_end_date, item.actual_end_date);

                            return (
                                <View key={index} style={[styles.tableRow, index === reports.length - 1 ? { borderBottom: 0 } : {}]}>
                                    <View style={styles.colSno}><Text>{index + 1}</Text></View>
                                    <View style={styles.colDesc}><Text>{item.description}</Text></View>
                                    <View style={[styles.colDate, { width: '6%' }]}><Text>{formatDateDisplay(item.planned_start_date)}</Text></View>
                                    <View style={[styles.colDate, { width: '6%' }]}><Text>{formatDateDisplay(item.planned_end_date)}</Text></View>
                                    <View style={[styles.colDay, { width: '3%' }]}><Text>{pDuration}</Text></View>
                                    <View style={[styles.colDate, { width: '6%' }]}><Text>{formatDateDisplay(item.actual_start_date)}</Text></View>
                                    <View style={[styles.colDate, { width: '6%' }]}><Text>{formatDateDisplay(item.actual_end_date)}</Text></View>
                                    <View style={[styles.colDay, { width: '3%' }]}><Text>{aDuration}</Text></View>
                                    <View style={styles.colDelay}><Text style={{ color: dStart > 0 ? '#ef4444' : '#000000', fontFamily: dStart > 0 ? 'Helvetica-Bold' : 'Helvetica' }}>{dStart}</Text></View>
                                    <View style={styles.colResp}><Text>{item.responsible_start || ""}</Text></View>
                                    <View style={styles.colRemarks}><Text>{item.remarks_start || ""}</Text></View>
                                    <View style={styles.colDelay}><Text style={{ color: dFinish > 0 ? '#ef4444' : '#000000', fontFamily: dFinish > 0 ? 'Helvetica-Bold' : 'Helvetica' }}>{dFinish}</Text></View>
                                    <View style={styles.colResp}><Text>{item.responsible_finish || ""}</Text></View>
                                    <View style={styles.colRemarksEnd}><Text>{item.remarks_end || ""}</Text></View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Page ${pageNumber} of ${totalPages}`
                )} fixed />
            </Page>
        </Document>
    );
};

export default HindrancePDF;
