import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#000000',
    },
    borderBox: {
        border: '1pt solid #000000',
        marginBottom: 0, // Removed bottom margin to prevent gaps
    },
    headerRow: {
        flexDirection: 'row',
        height: 60,
        borderBottom: '1pt solid #000000',
    },
    logoSection: {
        width: '30%', // Reduced from 60%
        borderRight: '1pt solid #000000',
        padding: 5,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
    },
    logo: {
        width: 150,
        height: 50,
        objectFit: 'contain',
    },
    companyDetails: {
        flexDirection: 'column',
        justifyContent: 'center',
    },
    companyName: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: '#1e3a8a',
        textTransform: 'uppercase',
    },
    companySub: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#1e40af',
    },
    companyTag: {
        fontSize: 7,
        fontFamily: 'Helvetica-Oblique',
        color: '#2563eb',
    },
    meetingSection: {
        width: '70%', // Increased from 40%
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 20,
    },
    meetingText: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
    },
    infoRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
        minHeight: 20,
        // alignItems: 'center', REMOVED
    },
    infoLabel: {
        fontFamily: 'Helvetica-Bold',
    },
    // Participants
    tableHeader: {
        backgroundColor: '#f3f4f6',
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
        textAlign: 'center',
        // padding: 2, REMOVED
        fontFamily: 'Helvetica-Bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
    },
    colOrganization: { width: '25%', borderRight: '1pt solid #000000', padding: 4, justifyContent: 'center', alignItems: 'center', fontFamily: 'Helvetica-Bold' },
    colResponsibility: { width: '20%', borderRight: '1pt solid #000000', padding: 4, justifyContent: 'center', alignItems: 'center' },

    // Points Table Minutes Specific
    pointsHeader: {
        backgroundColor: '#e5e7eb',
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
        minHeight: 25,
        // alignItems: 'center', REMOVED
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        fontSize: 9,
    },
    colSl: { width: 45, borderRight: '1pt solid #000000', textAlign: 'center', padding: 2, justifyContent: 'center' },
    colDesc: { flex: 1, borderRight: '1pt solid #000000', padding: 4, textAlign: 'left', justifyContent: 'center' },
    colStatus: { width: 40, borderRight: '1pt solid #000000', textAlign: 'center', padding: 2, justifyContent: 'center' },
    colTarget: { width: 60, borderRight: '1pt solid #000000', textAlign: 'center', padding: 2, justifyContent: 'center' },
    colAction: { width: 60, textAlign: 'center', padding: 2, justifyContent: 'center' },

    pointRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid #000000',
        minHeight: 20,
    },

    footer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
        fontSize: 8,
    },
    noteBox: {
        marginTop: 10,
        border: '1pt solid #d97706',
        backgroundColor: '#fffbeb',
        padding: 5,
    },
    noteTitle: {
        fontFamily: 'Helvetica-Bold',
        color: '#000000',
        marginBottom: 2,
        fontSize: 9,
    },
    noteText: {
        fontSize: 8,
        marginBottom: 2,
        color: '#000000',
    }
});

const toTitleCase = (str) => {
    if (!str) return "";
    return String(str).toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const MinutesPDF = ({ minutesDetails, project }) => {
    const dateStr = minutesDetails.date
        ? new Date(minutesDetails.date).toLocaleDateString("en-GB", {
            day: "numeric", month: "long", year: "numeric"
        })
        : "-";

    const clientName = project?.Employer || minutesDetails.client_name;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.borderBox}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View style={styles.logoSection}>
                            <Image src="/Mano-Logo.png" style={styles.logo} />
                        </View>
                        <View style={styles.meetingSection}>
                            <Text style={styles.meetingText}>MEETING - {minutesDetails.meeting_no}</Text>
                        </View>
                    </View>

                    {/* Client */}
                    <View style={[styles.infoRow, { padding: 4, flexDirection: 'row', alignItems: 'center' }]}>
                        <Text style={styles.infoLabel}>Client : </Text>
                        <Text>{clientName}</Text>
                    </View>

                    {/* Project & Job */}
                    <View style={styles.infoRow}>
                        <View style={{ width: '70%', borderRight: '1pt solid #000000', padding: 4, flexDirection: 'row' }}>
                            <Text style={styles.infoLabel}>Project : </Text>
                            <Text style={{ flex: 1 }}>{minutesDetails.project_name}</Text>
                        </View>
                        <View style={{ width: '30%', padding: 4, flexDirection: 'row' }}>
                            <Text style={styles.infoLabel}>JOB No : </Text>
                            <Text style={{ flex: 1 }}>2223-57 {minutesDetails.job_no}</Text>
                        </View>
                    </View>

                    {/* Subject, Venue, Date Row */}
                    <View style={styles.infoRow}>
                        <View style={{ width: '35%', borderRight: '1pt solid #000000', padding: 4, flexDirection: 'row' }}>
                            <Text style={styles.infoLabel}>Subject : </Text>
                            <Text style={{ flex: 1 }}>{minutesDetails.subject}</Text>
                        </View>
                        <View style={{ width: '35%', borderRight: '1pt solid #000000', padding: 4, flexDirection: 'row' }}>
                            <Text style={styles.infoLabel}>Venue : </Text>
                            <Text style={{ flex: 1 }}>{minutesDetails.venue}</Text>
                        </View>
                        <View style={{ width: '30%', padding: 4, flexDirection: 'row' }}>
                            <Text style={styles.infoLabel}>Date : </Text>
                            <Text style={{ flex: 1 }}>{dateStr}</Text>
                        </View>
                    </View>

                    {/* End of Header Box content */}
                </View>

                {/* Main Content Box: Participants + Legend + Points */}
                {/* borderTop: 0 to merge with the Header Box (which has borderBottom). marginTop: -1 to ensure perfect overlap of the connection line */}
                <View style={[styles.borderBox, { borderTop: 0, marginTop: -1 }]}>

                    {/* Participants Header Label */}
                    <View style={{ backgroundColor: '#f3f4f6', padding: 2, textAlign: 'center', borderBottom: '1pt solid #000000' }}>
                        <Text style={[styles.infoLabel, { fontSize: 9 }]}>Participants</Text>
                    </View>

                    {/* Participants Table Header */}
                    <View style={styles.tableHeader}>
                        <View style={{ width: '25%', borderRight: '1pt solid #000000', padding: 2, justifyContent: 'center' }}><Text>Organization</Text></View>
                        <View style={{ width: '20%', borderRight: '1pt solid #000000', padding: 2, justifyContent: 'center' }}><Text>Responsibility</Text></View>
                        <View style={{ width: '55%', padding: 2, justifyContent: 'center' }}><Text>Representatives</Text></View>
                    </View>

                    {/* Participants Rows */}
                    {(minutesDetails.processedParticipants || []).map((group, gIdx) => (
                        <View key={gIdx} style={styles.tableRow}>
                            <View style={styles.colOrganization}>
                                <Text>{toTitleCase(group.company_name)}</Text>
                            </View>

                            {/* Nested Rows Loop for Responsibility & Representatives */}
                            <View style={{ width: '75%', flexDirection: 'column' }}>
                                {(group.participants || []).map((p, pIdx) => (
                                    <View key={pIdx} style={{
                                        flexDirection: 'row',
                                        borderBottom: pIdx !== group.participants.length - 1 ? '1pt solid #000000' : 'none',
                                        minHeight: 20,
                                    }}>
                                        <View style={{ width: '26.67%', borderRight: '1pt solid #000000', padding: 4, justifyContent: 'center', alignItems: 'center' }}>
                                            <Text>{p.responsibilities || "-"}</Text>
                                        </View>
                                        <View style={{ width: '46.66%', borderRight: '1pt solid #000000', padding: 4, justifyContent: 'center' }}>
                                            <Text>{toTitleCase(p.contact_person)}</Text>
                                        </View>
                                        <View style={{ width: '26.67%', padding: 4, justifyContent: 'center' }}>
                                            <Text style={{ fontFamily: 'Helvetica-Oblique', color: '#000000' }}>{p.designation}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Legend */}
                    <View style={{ padding: 4, alignItems: 'center', borderBottom: '1pt solid #000000' }}>
                        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Oblique', color: '#000000' }}>
                            F= Fresh | A = Active | P = Pending | C = Complete / Closed
                        </Text>
                    </View>

                    {/* Points Table Header */}
                    <View style={styles.pointsHeader}>
                        <View style={styles.colSl}><Text>Sl No.</Text></View>
                        <View style={styles.colDesc}><Text>Description</Text></View>
                        <View style={styles.colStatus}><Text>S</Text></View>
                        <View style={styles.colTarget}><Text>Target Date</Text></View>
                        <View style={styles.colAction}><Text>Action By</Text></View>
                    </View>

                    {/* Points Rows */}
                    {(minutesDetails.content || []).map((point, idx) => (
                        <View key={idx} style={[styles.pointRow, { borderBottom: idx === minutesDetails.content.length - 1 ? 0 : '1pt solid #000000' }]}>
                            <View style={styles.colSl}>
                                <Text>{point.si_no}</Text>
                            </View>
                            <View style={styles.colDesc}>
                                <Text>{point.description}</Text>
                            </View>
                            <View style={styles.colStatus}>
                                <Text>{point.status}</Text>
                            </View>
                            <View style={styles.colTarget}>
                                <Text>{point.target_date ? new Date(point.target_date).toLocaleDateString("en-GB") : "-"}</Text>
                            </View>
                            <View style={styles.colAction}>
                                <Text>{point.action_by}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Note */}
                <View style={styles.noteBox}>
                    <Text style={styles.noteTitle}>NOTE :</Text>
                    <Text style={styles.noteText}>1. In case of any missing points or discrepancy, the respective stakeholders are requested to highlight the issue within 24 hours.</Text>
                    <Text style={styles.noteText}>2. All conversations shall be done via mail strictly.</Text>
                </View>

                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Page ${pageNumber} of ${totalPages}`
                )} fixed />
            </Page>
        </Document>
    );
};

export default MinutesPDF;
